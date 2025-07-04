import { Request, Response, Router } from "express";
import v1Router from "./v1";
import { auth } from "../../lib/auth";
import { fromNodeHeaders } from "better-auth/node";
import { DBUser, profilesTable, usersTable } from "../../db/schema";
import { db } from "../../db";
import { eq } from "drizzle-orm";
import { generateFromEmail } from "unique-username-generator/dist";
import { MAX_USERNAME_LENGTH } from "./v1/profile";

const apiRouter = Router();

apiRouter.get("/post-oauth-callback", async (req: Request, res: Response) => {
  const session = await auth.api.getSession({
    headers: fromNodeHeaders(req.headers),
  }) as {  user: DBUser  };
  if (!session) {
    res.redirect(`${process.env.WEB_FRONTEND_URL!}/login`);
    return;
  }

  const profile = await db.select().from(profilesTable).where(eq(profilesTable.userId, session.user.id)).limit(1);
  if (!profile[0]) {
    async function emailExists(email: string) {
      const result = await db.select().from(usersTable).where(eq(usersTable.email, email));
      return result.length > 0;
    }


    let username = generateFromEmail(session.user.email).slice(0, MAX_USERNAME_LENGTH);
    let i = 1;
    while (await emailExists(username)) {
      username = generateFromEmail(session.user.email, i).slice(0, MAX_USERNAME_LENGTH);
      i++;
    }

    const guessFirstName = session.user.name?.split(" ")[0] ?? "First";
    const guessLastName = session.user.name?.split(" ")[1] ?? "Last";
   
    await db.insert(profilesTable).values({
      userId: session.user.id,
      username,
      firstName: guessFirstName,
      lastName: guessLastName,
      avatarUrl: session.user.image,
    });

    res.redirect(`${process.env.WEB_FRONTEND_URL!}/profile?setup=true`);
    return;
  }

  res.redirect(`${process.env.WEB_FRONTEND_URL!}`);
});

apiRouter.use("/v1", v1Router);

export default apiRouter;

import { and, eq, gte, inArray, lte, sql, asc } from "drizzle-orm";
import { injectable } from "inversify";
import { db, DBOrTx } from "../../db/index.js";
import {
  externalPhasesTable,
  phasesTable,
  phaseTemplatesTable,
} from "../../db/schema.js";
import {
  DBExternalPhase,
  DBExternalPhaseInsert,
  DBExternalPhaseUpdate,
  DBPhase,
  DBPhaseInsert,
  DBPhaseUpdate,
} from "./phases.types.js";

@injectable()
export class PhasesRepository {
  async create(phase: DBPhaseInsert, dbOrTx: DBOrTx = db): Promise<DBPhase> {
    const [insertedPhase] = await dbOrTx
      .insert(phasesTable)
      .values(phase)
      .returning();
    return insertedPhase;
  }

  async update(
    phaseId: string,
    phase: DBPhaseUpdate,
    dbOrTx: DBOrTx = db,
  ): Promise<DBPhase> {
    const [updatedPhase] = await dbOrTx
      .update(phasesTable)
      .set(phase)
      .where(eq(phasesTable.id, phaseId))
      .returning();
    return updatedPhase;
  }

  async findExternalBySourceAndExternalId(
    dataSourceId: string,
    externalId: string,
    dbOrTx: DBOrTx = db,
  ): Promise<DBExternalPhase | null> {
    const [externalPhase] = await dbOrTx
      .select()
      .from(externalPhasesTable)
      .where(
        and(
          eq(externalPhasesTable.dataSourceId, dataSourceId),
          eq(externalPhasesTable.externalId, externalId),
        ),
      );

    return externalPhase ?? null;
  }

  async createExternal(
    externalPhase: DBExternalPhaseInsert,
    dbOrTx: DBOrTx = db,
  ): Promise<DBExternalPhase> {
    const [insertedExternalPhase] = await dbOrTx
      .insert(externalPhasesTable)
      .values(externalPhase)
      .returning();
    return insertedExternalPhase;
  }

  async updateExternal(
    dataSourceId: string,
    externalId: string,
    externalPhase: DBExternalPhaseUpdate,
    dbOrTx: DBOrTx = db,
  ): Promise<DBExternalPhase> {
    const [updatedExternalPhase] = await dbOrTx
      .update(externalPhasesTable)
      .set(externalPhase)
      .where(
        and(
          eq(externalPhasesTable.dataSourceId, dataSourceId),
          eq(externalPhasesTable.externalId, externalId),
        ),
      )
      .returning();
    return updatedExternalPhase;
  }

  async findCurrentPhases(
    startPhaseTemplateId: string,
    endPhaseTemplateId: string,
    currentDate: Date,
    dbOrTx: DBOrTx = db,
  ): Promise<DBPhase[]> {
    // Get all phases that:
    // 1. Are between the start and end phase templates (inclusive)
    // 2. Have the current date between their start and end dates
    const phases = await dbOrTx
      .select({
        phase: phasesTable,
      })
      .from(phasesTable)
      .innerJoin(
        phaseTemplatesTable,
        eq(phasesTable.phaseTemplateId, phaseTemplatesTable.id),
      )
      .where(
        and(
          // Phase template is between start and end templates (inclusive)
          gte(
            phaseTemplatesTable.sequence,
            sql`(
            SELECT sequence FROM ${phaseTemplatesTable}
            WHERE id = ${startPhaseTemplateId}
          )`,
          ),
          lte(
            phaseTemplatesTable.sequence,
            sql`(
            SELECT sequence FROM ${phaseTemplatesTable}
            WHERE id = ${endPhaseTemplateId}
          )`,
          ),
          // Current date is between phase start and end dates
          lte(phasesTable.startDate, currentDate),
          gte(phasesTable.endDate, currentDate),
        ),
      )
      .orderBy(phaseTemplatesTable.sequence);

    return phases.map((p) => p.phase);
  }

  async findNextPhases(
    startPhaseTemplateId: string,
    endPhaseTemplateId: string,
    currentDate: Date,
    dbOrTx: DBOrTx = db,
  ): Promise<DBPhase[]> {
    // Get all phases that:
    // 1. Are between the start and end phase templates (inclusive)
    // 2. Start after the current date
    const phases = await dbOrTx
      .select({
        phase: phasesTable,
      })
      .from(phasesTable)
      .innerJoin(
        phaseTemplatesTable,
        eq(phasesTable.phaseTemplateId, phaseTemplatesTable.id),
      )
      .where(
        and(
          // Phase template is between start and end templates (inclusive)
          gte(
            phaseTemplatesTable.sequence,
            sql`(
            SELECT sequence FROM ${phaseTemplatesTable}
            WHERE id = ${startPhaseTemplateId}
          )`,
          ),
          lte(
            phaseTemplatesTable.sequence,
            sql`(
            SELECT sequence FROM ${phaseTemplatesTable}
            WHERE id = ${endPhaseTemplateId}
          )`,
          ),
          // Phase starts after current date
          gte(phasesTable.startDate, currentDate),
        ),
      )
      .orderBy(phaseTemplatesTable.sequence);

    return phases.map((p) => p.phase);
  }

  async listBySeasonIds(
    seasonIds: string[],
    dbOrTx: DBOrTx = db,
  ): Promise<DBPhase[]> {
    if (seasonIds.length === 0) {
      return [];
    }
    return dbOrTx
      .select()
      .from(phasesTable)
      .where(inArray(phasesTable.seasonId, seasonIds));
  }

  async findCurrentBySeasonIds(
    seasonIds: string[],
    dbOrTx: DBOrTx = db,
  ): Promise<DBPhase[]> {
    if (seasonIds.length === 0) {
      return [];
    }
    const now = new Date();
    return dbOrTx
      .select()
      .from(phasesTable)
      .where(
        and(
          inArray(phasesTable.seasonId, seasonIds),
          lte(phasesTable.startDate, now),
          gte(phasesTable.endDate, now),
        ),
      );
  }

  async findNextBySeasonIds(
    seasonIds: string[],
    dbOrTx: DBOrTx = db,
  ): Promise<DBPhase[]> {
    if (seasonIds.length === 0) {
      return [];
    }
    const now = new Date();
    const futurePhases = await dbOrTx
      .select()
      .from(phasesTable)
      .where(
        and(
          inArray(phasesTable.seasonId, seasonIds),
          gte(phasesTable.startDate, now),
        ),
      )
      .orderBy(phasesTable.seasonId, asc(phasesTable.startDate));

    const nextPhasesMap = new Map<string, DBPhase>();
    for (const phase of futurePhases) {
      if (!nextPhasesMap.has(phase.seasonId)) {
        nextPhasesMap.set(phase.seasonId, phase);
      }
    }
    return Array.from(nextPhasesMap.values());
  }

  async listExternalByPhaseIds(
    phaseIds: string[],
    dbOrTx: DBOrTx = db,
  ): Promise<DBExternalPhase[]> {
    const externalPhases = await dbOrTx
      .select()
      .from(externalPhasesTable)
      .where(inArray(externalPhasesTable.phaseId, phaseIds));
    return externalPhases;
  }

  async findPreviousPhase(
    currentPhaseId: string,
    startPhaseTemplateId: string,
    endPhaseTemplateId: string,
    dbOrTx: DBOrTx = db,
  ): Promise<DBPhase | null> {
    // Get the current phase to find its sequence
    const [currentPhase] = await dbOrTx
      .select({
        phase: phasesTable,
        phaseTemplate: phaseTemplatesTable,
      })
      .from(phasesTable)
      .innerJoin(
        phaseTemplatesTable,
        eq(phasesTable.phaseTemplateId, phaseTemplatesTable.id),
      )
      .where(eq(phasesTable.id, currentPhaseId));

    if (!currentPhase) {
      return null;
    }

    // Find the previous phase with a lower sequence within the league's range
    const [previousPhase] = await dbOrTx
      .select({
        phase: phasesTable,
      })
      .from(phasesTable)
      .innerJoin(
        phaseTemplatesTable,
        eq(phasesTable.phaseTemplateId, phaseTemplatesTable.id),
      )
      .where(
        and(
          // Phase template is between start and end templates (inclusive)
          gte(
            phaseTemplatesTable.sequence,
            sql`(
            SELECT sequence FROM ${phaseTemplatesTable}
            WHERE id = ${startPhaseTemplateId}
          )`,
          ),
          lte(
            phaseTemplatesTable.sequence,
            sql`(
            SELECT sequence FROM ${phaseTemplatesTable}
            WHERE id = ${endPhaseTemplateId}
          )`,
          ),
          // Sequence is less than current phase's sequence
          sql`${phaseTemplatesTable.sequence} < ${currentPhase.phaseTemplate.sequence}`,
        ),
      )
      .orderBy(sql`${phaseTemplatesTable.sequence} DESC`)
      .limit(1);

    return previousPhase?.phase || null;
  }

  async findNextPhase(
    currentPhaseId: string,
    startPhaseTemplateId: string,
    endPhaseTemplateId: string,
    dbOrTx: DBOrTx = db,
  ): Promise<DBPhase | null> {
    // Get the current phase to find its sequence
    const [currentPhase] = await dbOrTx
      .select({
        phase: phasesTable,
        phaseTemplate: phaseTemplatesTable,
      })
      .from(phasesTable)
      .innerJoin(
        phaseTemplatesTable,
        eq(phasesTable.phaseTemplateId, phaseTemplatesTable.id),
      )
      .where(eq(phasesTable.id, currentPhaseId));

    if (!currentPhase) {
      return null;
    }

    // Find the next phase with a higher sequence within the league's range
    const [nextPhase] = await dbOrTx
      .select({
        phase: phasesTable,
      })
      .from(phasesTable)
      .innerJoin(
        phaseTemplatesTable,
        eq(phasesTable.phaseTemplateId, phaseTemplatesTable.id),
      )
      .where(
        and(
          // Phase template is between start and end templates (inclusive)
          gte(
            phaseTemplatesTable.sequence,
            sql`(
            SELECT sequence FROM ${phaseTemplatesTable}
            WHERE id = ${startPhaseTemplateId}
          )`,
          ),
          lte(
            phaseTemplatesTable.sequence,
            sql`(
            SELECT sequence FROM ${phaseTemplatesTable}
            WHERE id = ${endPhaseTemplateId}
          )`,
          ),
          // Sequence is greater than current phase's sequence
          sql`${phaseTemplatesTable.sequence} > ${currentPhase.phaseTemplate.sequence}`,
        ),
      )
      .orderBy(sql`${phaseTemplatesTable.sequence} ASC`)
      .limit(1);

    return nextPhase?.phase || null;
  }

  async findById(id: string, dbOrTx: DBOrTx = db): Promise<DBPhase | null> {
    const [phase] = await dbOrTx
      .select()
      .from(phasesTable)
      .where(eq(phasesTable.id, id));
    return phase || null;
  }
}

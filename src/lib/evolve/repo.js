import { base44 } from "@/api/base44Client";

/**
 * Persistence boundary. The engine never talks to the database directly — it
 * hands plain records to this module, so the storage layer can change freely.
 */
export const evolveRepo = {
  async latestExperiment() {
    const list = await base44.entities.EvolveExperiment.list("-created_date", 1);
    return list[0] || null;
  },

  async loadRecords(experimentId) {
    const [worlds, agents, assets, jobs, orgs, transactions, events] = await Promise.all([
      base44.entities.EvolveWorld.filter({ experiment_id: experimentId }, "-created_date", 1),
      base44.entities.EvolveAgent.filter({ experiment_id: experimentId }, "code", 400),
      base44.entities.EvolveAsset.filter({ experiment_id: experimentId }, "sim_id", 400),
      base44.entities.EvolveJob.filter({ experiment_id: experimentId }, "created_date", 120),
      base44.entities.EvolveOrganization.filter({ experiment_id: experimentId }, "created_date", 40),
      base44.entities.EvolveTransaction.filter({ experiment_id: experimentId }, "-created_date", 120),
      base44.entities.EvolveEvent.filter({ experiment_id: experimentId }, "-created_date", 200),
    ]);
    return {
      world: worlds[0] || null,
      agents,
      assets,
      jobs,
      orgs,
      transactions,
      events: [...events].reverse(),
    };
  },

  /** Writes the genesis state once, so a reload resumes the same civilization. */
  async saveGenesis(experimentId, records) {
    const id = experimentId;
    const stamp = (arr) => arr.map((r) => ({ ...r, experiment_id: id }));

    await base44.entities.EvolveWorld.create({ experiment_id: id, ...records.world });
    await Promise.all([
      base44.entities.EvolveAgent.bulkCreate(stamp(records.agents)),
      base44.entities.EvolveJob.bulkCreate(stamp(records.jobs)),
      base44.entities.EvolveOrganization.bulkCreate(stamp(records.orgs)),
      base44.entities.EvolveTransaction.bulkCreate(stamp(records.transactions)),
      base44.entities.EvolveAsset.bulkCreate(stamp(records.assets)),
      base44.entities.EvolveEvent.bulkCreate(stamp(records.events.slice(0, 120))),
    ]);
    return id;
  },

  async createExperiment(data) {
    return base44.entities.EvolveExperiment.create(data);
  },

  async updateExperiment(id, data) {
    if (!id) return null;
    return base44.entities.EvolveExperiment.update(id, data);
  },

  /** Periodic checkpoint: world grid, headline numbers and the generation snapshot. */
  async checkpoint(experimentId, records) {
    if (!experimentId) return null;
    const worlds = await base44.entities.EvolveWorld.filter({ experiment_id: experimentId }, "-created_date", 1);
    const world = worlds[0];
    if (world) {
      await base44.entities.EvolveWorld.update(world.id, {
        ownership: records.world.ownership,
        sculpted: records.world.sculpted,
        day: records.world.day,
        resources: records.world.resources,
        market: records.world.market,
      });
    }
    await base44.entities.EvolveExperiment.update(experimentId, {
      world_day: records.experiment.world_day,
      generation: records.experiment.generation,
      population: records.experiment.population,
      treasury_balance: records.experiment.treasury_balance,
      status: records.experiment.status,
    });
    return base44.entities.EvolveSnapshot.create({ experiment_id: experimentId, ...records.snapshot });
  },

  async appendEvents(experimentId, events) {
    if (!experimentId || !events.length) return null;
    return base44.entities.EvolveEvent.bulkCreate(events.map((e) => ({ ...e, experiment_id: experimentId })));
  },
};
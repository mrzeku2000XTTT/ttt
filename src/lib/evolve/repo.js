import { base44 } from "@/api/base44Client";

/* Engine-side ids are internal keys, never record ids — they are stored in
   their own fields (agent_key, sim_id, org_key) so the database owns `id`. */
const strip = (r) => {
  const { id, ...rest } = r;
  return rest;
};

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
    const [worlds, agents, assets, jobs, orgs, transactions, events, players, contracts] = await Promise.all([
      base44.entities.EvolveWorld.filter({ experiment_id: experimentId }, "-created_date", 1),
      base44.entities.EvolveAgent.filter({ experiment_id: experimentId }, "code", 400),
      base44.entities.EvolveAsset.filter({ experiment_id: experimentId }, "sim_id", 400),
      base44.entities.EvolveJob.filter({ experiment_id: experimentId }, "created_date", 120),
      base44.entities.EvolveOrganization.filter({ experiment_id: experimentId }, "created_date", 40),
      base44.entities.EvolveTransaction.filter({ experiment_id: experimentId }, "-created_date", 120),
      base44.entities.EvolveEvent.filter({ experiment_id: experimentId }, "-created_date", 200),
      base44.entities.EvolvePlayer.filter({ experiment_id: experimentId }, "code", 100),
      base44.entities.EvolveContract.filter({ experiment_id: experimentId }, "created_date", 50),
    ]);
    return {
      world: worlds[0] || null,
      agents,
      assets,
      jobs,
      orgs,
      transactions,
      events: [...events].reverse(),
      players,
      contracts,
    };
  },

  /** Writes the genesis state once, so a reload resumes the same civilization. */
  async saveGenesis(experimentId, records) {
    const id = experimentId;
    const stamp = (arr) => arr.map((r) => ({ ...strip(r), experiment_id: id }));

    await base44.entities.EvolveWorld.create({ experiment_id: id, ...records.world });
    await Promise.all([
      base44.entities.EvolveAgent.bulkCreate(stamp(records.agents)),
      base44.entities.EvolveJob.bulkCreate(stamp(records.jobs)),
      base44.entities.EvolveOrganization.bulkCreate(stamp(records.orgs)),
      base44.entities.EvolveTransaction.bulkCreate(stamp(records.transactions)),
      base44.entities.EvolveAsset.bulkCreate(stamp(records.assets)),
      base44.entities.EvolveEvent.bulkCreate(stamp(records.events.slice(0, 120))),
      records.players?.length ? base44.entities.EvolvePlayer.bulkCreate(stamp(records.players)) : Promise.resolve(),
      records.contracts?.length ? base44.entities.EvolveContract.bulkCreate(stamp(records.contracts)) : Promise.resolve(),
    ]);
    return id;
  },

  async createExperiment(data) {
    return base44.entities.EvolveExperiment.create(strip(data));
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
    // Sync players (upsert by player_key).
    if (records.players?.length) {
      const existing = await base44.entities.EvolvePlayer.filter({ experiment_id: experimentId }, "code", 100);
      const byKey = new Map(existing.map((p) => [p.player_key, p]));
      const toCreate = [];
      const toUpdate = [];
      records.players.forEach((p) => {
        const rec = byKey.get(p.player_key);
        if (rec) {
          toUpdate.push({ id: rec.id, ...p, experiment_id: experimentId });
        } else {
          toCreate.push({ ...p, experiment_id: experimentId });
        }
      });
      if (toCreate.length) await base44.entities.EvolvePlayer.bulkCreate(toCreate);
      for (const u of toUpdate) {
        await base44.entities.EvolvePlayer.update(u.id, u);
      }
    }
    return base44.entities.EvolveSnapshot.create({ experiment_id: experimentId, ...records.snapshot });
  },

  async appendEvents(experimentId, events) {
    if (!experimentId || !events.length) return null;
    return base44.entities.EvolveEvent.bulkCreate(events.map((e) => ({ ...strip(e), experiment_id: experimentId })));
  },

  /** Deletes every record belonging to an experiment so a new genesis can begin. */
  async resetExperiment(experimentId) {
    if (!experimentId) return null;
    await Promise.all([
      base44.entities.EvolveAgent.deleteMany({ experiment_id: experimentId }),
      base44.entities.EvolveAsset.deleteMany({ experiment_id: experimentId }),
      base44.entities.EvolveJob.deleteMany({ experiment_id: experimentId }),
      base44.entities.EvolveOrganization.deleteMany({ experiment_id: experimentId }),
      base44.entities.EvolveTransaction.deleteMany({ experiment_id: experimentId }),
      base44.entities.EvolveEvent.deleteMany({ experiment_id: experimentId }),
      base44.entities.EvolveSnapshot.deleteMany({ experiment_id: experimentId }),
      base44.entities.EvolveWallet.deleteMany({ experiment_id: experimentId }),
      base44.entities.EvolvePlayer.deleteMany({ experiment_id: experimentId }),
      base44.entities.EvolveContract.deleteMany({ experiment_id: experimentId }),
    ]);
    const worlds = await base44.entities.EvolveWorld.filter({ experiment_id: experimentId }, "-created_date", 1);
    if (worlds[0]) await base44.entities.EvolveWorld.delete(worlds[0].id);
    await base44.entities.EvolveExperiment.delete(experimentId);
    return true;
  },
};
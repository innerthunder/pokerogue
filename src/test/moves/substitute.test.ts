import {afterEach, beforeAll, beforeEach, describe, expect, test, vi} from "vitest";
import Phaser from "phaser";
import GameManager from "#app/test/utils/gameManager";
import * as overrides from "#app/overrides";
import { Species } from "#app/enums/species.js";
import { Abilities } from "#app/enums/abilities.js";
import { Moves } from "#app/enums/moves.js";
import { getMovePosition } from "../utils/gameManagerUtils";
import { BerryPhase, MoveEndPhase } from "#app/phases.js";
import { BattlerTagType } from "#app/enums/battler-tag-type.js";
import { BattleStat } from "#app/data/battle-stat.js";
import { allMoves, StealHeldItemChanceAttr } from "#app/data/move.js";
import { TrappedTag } from "#app/data/battler-tags.js";
import { StatusEffect } from "#app/data/status-effect.js";
import { BerryType } from "#app/enums/berry-type.js";

const TIMEOUT = 20 * 1000; // 20 sec timeout

describe("Moves - Substitute", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;

  beforeAll(() => {
    phaserGame = new Phaser.Game({
      type: Phaser.HEADLESS,
    });
  });

  afterEach(() => {
    game.phaseInterceptor.restoreOg();
  });

  beforeEach(() => {
    game = new GameManager(phaserGame);

    vi.spyOn(overrides, "SINGLE_BATTLE_OVERRIDE", "get").mockReturnValue(true);
    vi.spyOn(overrides, "MOVESET_OVERRIDE", "get").mockReturnValue([Moves.SUBSTITUTE, Moves.SWORDS_DANCE, Moves.TACKLE, Moves.SPLASH]);
    vi.spyOn(overrides, "OPP_SPECIES_OVERRIDE", "get").mockReturnValue(Species.SNORLAX);
    vi.spyOn(overrides, "OPP_ABILITY_OVERRIDE", "get").mockReturnValue(Abilities.INSOMNIA);
    vi.spyOn(overrides, "OPP_MOVESET_OVERRIDE", "get").mockReturnValue([Moves.SPLASH, Moves.SPLASH, Moves.SPLASH, Moves.SPLASH]);
    vi.spyOn(overrides, "STARTING_LEVEL_OVERRIDE", "get").mockReturnValue(100);
    vi.spyOn(overrides, "OPP_LEVEL_OVERRIDE", "get").mockReturnValue(100);
  });

  test(
    "move should cause the user to take damage",
    async () => {
      await game.startBattle([Species.MAGIKARP]);

      const leadPokemon = game.scene.getPlayerPokemon();
      expect(leadPokemon).toBeDefined();

      const enemyPokemon = game.scene.getEnemyPokemon();
      expect(enemyPokemon).toBeDefined();

      game.doAttack(getMovePosition(game.scene, 0, Moves.SUBSTITUTE));

      await game.phaseInterceptor.to(MoveEndPhase, false);

      expect(leadPokemon.hp).toBe(Math.floor(leadPokemon.getMaxHp() * 3/4));
    }, TIMEOUT
  );

  test(
    "move should not cause the user to take damage if the user has Magic Guard",
    async () => {
      vi.spyOn(overrides, "ABILITY_OVERRIDE", "get").mockReturnValue(Abilities.MAGIC_GUARD);

      await game.startBattle([Species.MAGIKARP]);

      const leadPokemon = game.scene.getPlayerPokemon();
      expect(leadPokemon).toBeDefined();

      const enemyPokemon = game.scene.getEnemyPokemon();
      expect(enemyPokemon).toBeDefined();

      game.doAttack(getMovePosition(game.scene, 0, Moves.SUBSTITUTE));

      await game.phaseInterceptor.to(MoveEndPhase, false);

      expect(leadPokemon.hp).toBe(leadPokemon.getMaxHp());
    }, TIMEOUT
  );

  test(
    "move should redirect enemy attack damage to the Substitute doll",
    async () => {
      vi.spyOn(overrides, "OPP_MOVESET_OVERRIDE", "get").mockReturnValue([Moves.TACKLE, Moves.TACKLE, Moves.TACKLE, Moves.TACKLE]);

      await game.startBattle([Species.SKARMORY]);

      const leadPokemon = game.scene.getPlayerPokemon();
      expect(leadPokemon).toBeDefined();

      const enemyPokemon = game.scene.getEnemyPokemon();
      expect(enemyPokemon).toBeDefined();

      game.doAttack(getMovePosition(game.scene, 0, Moves.SUBSTITUTE));

      await game.phaseInterceptor.to(MoveEndPhase, false);

      expect(leadPokemon.hp).toBe(Math.floor(leadPokemon.getMaxHp() * 3/4));
      expect(leadPokemon.getTag(BattlerTagType.SUBSTITUTE)).toBeDefined();
      const postSubHp = leadPokemon.hp;

      await game.phaseInterceptor.to(BerryPhase, false);

      expect(leadPokemon.hp).toBe(postSubHp);
      expect(leadPokemon.getTag(BattlerTagType.SUBSTITUTE)).toBeDefined();
    }, TIMEOUT
  );

  test(
    "move effect should lapse if hit by a strong move",
    async () => {
      // Giga Impact OHKOs Magikarp if substitute isn't up
      vi.spyOn(overrides, "OPP_MOVESET_OVERRIDE", "get").mockReturnValue([Moves.GIGA_IMPACT, Moves.GIGA_IMPACT, Moves.GIGA_IMPACT, Moves.GIGA_IMPACT]);
      vi.spyOn(allMoves[Moves.GIGA_IMPACT], "accuracy", "get").mockReturnValue(100);

      await game.startBattle([Species.MAGIKARP]);

      const leadPokemon = game.scene.getPlayerPokemon();
      expect(leadPokemon).toBeDefined();

      const enemyPokemon = game.scene.getEnemyPokemon();
      expect(enemyPokemon).toBeDefined();

      game.doAttack(getMovePosition(game.scene, 0, Moves.SUBSTITUTE));

      await game.phaseInterceptor.to(MoveEndPhase, false);

      expect(leadPokemon.hp).toBe(Math.floor(leadPokemon.getMaxHp() * 3/4));
      expect(leadPokemon.getTag(BattlerTagType.SUBSTITUTE)).toBeDefined();
      const postSubHp = leadPokemon.hp;

      await game.phaseInterceptor.to(BerryPhase, false);

      expect(leadPokemon.hp).toBe(postSubHp);
      expect(leadPokemon.getTag(BattlerTagType.SUBSTITUTE)).toBeUndefined();
    }, TIMEOUT
  );

  test(
    "move should block stat changes from status moves",
    async () => {
      vi.spyOn(overrides, "OPP_MOVESET_OVERRIDE", "get").mockReturnValue([Moves.CHARM, Moves.CHARM, Moves.CHARM, Moves.CHARM]);

      await game.startBattle([Species.MAGIKARP]);

      const leadPokemon = game.scene.getPlayerPokemon();
      expect(leadPokemon).toBeDefined();

      const enemyPokemon = game.scene.getEnemyPokemon();
      expect(enemyPokemon).toBeDefined();

      game.doAttack(getMovePosition(game.scene, 0, Moves.SUBSTITUTE));

      await game.phaseInterceptor.to(BerryPhase, false);

      expect(leadPokemon.summonData.battleStats[BattleStat.ATK]).toBe(0);
      expect(leadPokemon.getTag(BattlerTagType.SUBSTITUTE)).toBeDefined();
    }
  );

  test(
    "move effect should be bypassed by sound-based moves",
    async () => {
      vi.spyOn(overrides, "OPP_MOVESET_OVERRIDE", "get").mockReturnValue([Moves.ECHOED_VOICE,Moves.ECHOED_VOICE,Moves.ECHOED_VOICE,Moves.ECHOED_VOICE]);

      await game.startBattle([Species.BLASTOISE]);

      const leadPokemon = game.scene.getPlayerPokemon();
      expect(leadPokemon).toBeDefined();

      const enemyPokemon = game.scene.getEnemyPokemon();
      expect(enemyPokemon).toBeDefined();

      game.doAttack(getMovePosition(game.scene, 0, Moves.SUBSTITUTE));

      await game.phaseInterceptor.to(MoveEndPhase);

      expect(leadPokemon.getTag(BattlerTagType.SUBSTITUTE)).toBeDefined();
      const postSubHp = leadPokemon.hp;

      await game.phaseInterceptor.to(BerryPhase, false);

      expect(leadPokemon.getTag(BattlerTagType.SUBSTITUTE)).toBeDefined();
      expect(leadPokemon.hp).toBeLessThan(postSubHp);
    }, TIMEOUT
  );

  test(
    "move effect should be bypassed by attackers with Infiltrator",
    async () => {
      vi.spyOn(overrides, "OPP_MOVESET_OVERRIDE", "get").mockReturnValue([Moves.TACKLE,Moves.TACKLE,Moves.TACKLE,Moves.TACKLE]);
      vi.spyOn(overrides, "OPP_ABILITY_OVERRIDE", "get").mockReturnValue(Abilities.INFILTRATOR);

      await game.startBattle([Species.BLASTOISE]);

      const leadPokemon = game.scene.getPlayerPokemon();
      expect(leadPokemon).toBeDefined();

      const enemyPokemon = game.scene.getEnemyPokemon();
      expect(enemyPokemon).toBeDefined();

      game.doAttack(getMovePosition(game.scene, 0, Moves.SUBSTITUTE));

      await game.phaseInterceptor.to(MoveEndPhase);

      expect(leadPokemon.getTag(BattlerTagType.SUBSTITUTE)).toBeDefined();
      const postSubHp = leadPokemon.hp;

      await game.phaseInterceptor.to(BerryPhase, false);

      expect(leadPokemon.getTag(BattlerTagType.SUBSTITUTE)).toBeDefined();
      expect(leadPokemon.hp).toBeLessThan(postSubHp);
    }, TIMEOUT
  );

  test(
    "move effect shouldn't block the user's own status moves",
    async () => {
      await game.startBattle([Species.BLASTOISE]);

      const leadPokemon = game.scene.getPlayerPokemon();
      expect(leadPokemon).toBeDefined();

      const enemyPokemon = game.scene.getEnemyPokemon();
      expect(enemyPokemon).toBeDefined();

      leadPokemon.addTag(BattlerTagType.SUBSTITUTE, null, null, leadPokemon.id);
      expect(leadPokemon.getTag(BattlerTagType.SUBSTITUTE)).toBeDefined();

      game.doAttack(getMovePosition(game.scene, 0, Moves.SWORDS_DANCE));

      await game.phaseInterceptor.to(MoveEndPhase, false);

      expect(leadPokemon.summonData.battleStats[BattleStat.ATK]).toBe(2);
    }, TIMEOUT
  );

  test(
    "move effect should prevent the user from flinching",
    async () => {
      vi.spyOn(overrides, "OPP_MOVESET_OVERRIDE", "get").mockReturnValue([Moves.FAKE_OUT,Moves.FAKE_OUT,Moves.FAKE_OUT,Moves.FAKE_OUT]);
      vi.spyOn(overrides, "STARTING_LEVEL_OVERRIDE", "get").mockReturnValue(1); // Ensures the Substitute will break

      await game.startBattle([Species.BLASTOISE]);

      const leadPokemon = game.scene.getPlayerPokemon();
      expect(leadPokemon).toBeDefined();

      const enemyPokemon = game.scene.getEnemyPokemon();
      expect(enemyPokemon).toBeDefined();

      leadPokemon.addTag(BattlerTagType.SUBSTITUTE, null, null, leadPokemon.id);

      game.doAttack(getMovePosition(game.scene, 0, Moves.TACKLE));

      await game.phaseInterceptor.to(BerryPhase, false);

      expect(enemyPokemon.hp).toBeLessThan(enemyPokemon.getMaxHp());
    }, TIMEOUT
  );

  test(
    "move effect should prevent the user from being trapped",
    async () => {
      vi.spyOn(allMoves[Moves.SAND_TOMB], "accuracy", "get").mockReturnValue(100);
      vi.spyOn(overrides, "OPP_MOVESET_OVERRIDE", "get").mockReturnValue([Moves.SAND_TOMB,Moves.SAND_TOMB,Moves.SAND_TOMB,Moves.SAND_TOMB]);

      await game.startBattle([Species.BLASTOISE]);

      const leadPokemon = game.scene.getPlayerPokemon();
      expect(leadPokemon).toBeDefined();

      const enemyPokemon = game.scene.getEnemyPokemon();
      expect(enemyPokemon).toBeDefined();

      leadPokemon.addTag(BattlerTagType.SUBSTITUTE, null, null, leadPokemon.id);

      game.doAttack(getMovePosition(game.scene, 0, Moves.SPLASH));

      await game.phaseInterceptor.to(BerryPhase, false);

      expect(leadPokemon.getTag(TrappedTag)).toBeUndefined();
    }, TIMEOUT
  );

  test(
    "move effect should prevent the user's stats from being lowered",
    async () => {
      vi.spyOn(allMoves[Moves.LIQUIDATION], "chance", "get").mockReturnValue(100);
      vi.spyOn(overrides, "OPP_MOVESET_OVERRIDE", "get").mockReturnValue([Moves.LIQUIDATION,Moves.LIQUIDATION,Moves.LIQUIDATION,Moves.LIQUIDATION]);

      await game.startBattle([Species.BLASTOISE]);

      const leadPokemon = game.scene.getPlayerPokemon();
      expect(leadPokemon).toBeDefined();

      const enemyPokemon = game.scene.getEnemyPokemon();
      expect(enemyPokemon).toBeDefined();

      leadPokemon.addTag(BattlerTagType.SUBSTITUTE, null, null, leadPokemon.id);

      game.doAttack(getMovePosition(game.scene, 0, Moves.SPLASH));

      await game.phaseInterceptor.to(BerryPhase, false);

      expect(leadPokemon.summonData.battleStats[BattleStat.DEF]).toBe(0);
    }, TIMEOUT
  );

  test(
    "move effect should prevent the user from being afflicted with status effects",
    async () => {
      vi.spyOn(overrides, "OPP_MOVESET_OVERRIDE", "get").mockReturnValue([Moves.NUZZLE,Moves.NUZZLE,Moves.NUZZLE,Moves.NUZZLE]);

      await game.startBattle([Species.BLASTOISE]);

      const leadPokemon = game.scene.getPlayerPokemon();
      expect(leadPokemon).toBeDefined();

      const enemyPokemon = game.scene.getEnemyPokemon();
      expect(enemyPokemon).toBeDefined();

      leadPokemon.addTag(BattlerTagType.SUBSTITUTE, null, null, leadPokemon.id);

      game.doAttack(getMovePosition(game.scene, 0, Moves.SPLASH));

      await game.phaseInterceptor.to(BerryPhase, false);

      expect(leadPokemon.status?.effect).not.toBe(StatusEffect.PARALYSIS);
    }, TIMEOUT
  );

  test(
    "move effect should prevent the user's items from being stolen",
    async () => {
      vi.spyOn(overrides, "OPP_MOVESET_OVERRIDE", "get").mockReturnValue([Moves.THIEF,Moves.THIEF,Moves.THIEF,Moves.THIEF]);
      vi.spyOn(allMoves[Moves.THIEF], "attrs", "get").mockReturnValue([new StealHeldItemChanceAttr(1.0)]); // give Thief 100% steal rate
      vi.spyOn(overrides, "STARTING_HELD_ITEMS_OVERRIDE", "get").mockReturnValue([{name: "BERRY", type: BerryType.SITRUS}]);

      await game.startBattle([Species.BLASTOISE]);

      const leadPokemon = game.scene.getPlayerPokemon();
      expect(leadPokemon).toBeDefined();

      const enemyPokemon = game.scene.getEnemyPokemon();
      expect(enemyPokemon).toBeDefined();

      leadPokemon.addTag(BattlerTagType.SUBSTITUTE, null, null, leadPokemon.id);

      game.doAttack(getMovePosition(game.scene, 0, Moves.SPLASH));

      await game.phaseInterceptor.to(BerryPhase, false);

      expect(leadPokemon.getHeldItems().length).toBe(1);
    }, TIMEOUT
  );

  test(
    "move effect should prevent the user's items from being removed",
    async () => {
      vi.spyOn(overrides, "MOVESET_OVERRIDE", "get").mockReturnValue([Moves.KNOCK_OFF]);
      vi.spyOn(overrides, "OPP_HELD_ITEMS_OVERRIDE", "get").mockReturnValue([{name: "BERRY", type: BerryType.SITRUS}]);

      await game.startBattle([Species.BLASTOISE]);

      const leadPokemon = game.scene.getPlayerPokemon();
      expect(leadPokemon).toBeDefined();

      const enemyPokemon = game.scene.getEnemyPokemon();
      expect(enemyPokemon).toBeDefined();

      enemyPokemon.addTag(BattlerTagType.SUBSTITUTE, null, null, enemyPokemon.id);
      const enemyNumItems = enemyPokemon.getHeldItems().length;

      game.doAttack(getMovePosition(game.scene, 0, Moves.KNOCK_OFF));

      await game.phaseInterceptor.to(MoveEndPhase, false);

      expect(enemyPokemon.getHeldItems().length).toBe(enemyNumItems);
    }, TIMEOUT
  );

  test(
    "move effect should prevent the user's berries from being stolen and eaten",
    async () => {
      vi.spyOn(overrides, "OPP_MOVESET_OVERRIDE", "get").mockReturnValue([Moves.BUG_BITE,Moves.BUG_BITE,Moves.BUG_BITE,Moves.BUG_BITE]);
      vi.spyOn(overrides, "STARTING_HELD_ITEMS_OVERRIDE", "get").mockReturnValue([{name: "BERRY", type: BerryType.SITRUS}]);

      await game.startBattle([Species.BLASTOISE]);

      const leadPokemon = game.scene.getPlayerPokemon();
      expect(leadPokemon).toBeDefined();

      const enemyPokemon = game.scene.getEnemyPokemon();
      expect(enemyPokemon).toBeDefined();

      leadPokemon.addTag(BattlerTagType.SUBSTITUTE, null, null, leadPokemon.id);

      game.doAttack(getMovePosition(game.scene, 0, Moves.TACKLE));

      await game.phaseInterceptor.to(MoveEndPhase, false);
      const enemyPostAttackHp = enemyPokemon.hp;

      await game.phaseInterceptor.to(BerryPhase, false);

      expect(leadPokemon.getHeldItems().length).toBe(1);
      expect(enemyPokemon.hp).toBe(enemyPostAttackHp);
    }, TIMEOUT
  );

  test(
    "move effect should prevent the user's stats from being reset by Clear Smog",
    async () => {
      vi.spyOn(overrides, "OPP_MOVESET_OVERRIDE", "get").mockReturnValue([Moves.CLEAR_SMOG,Moves.CLEAR_SMOG,Moves.CLEAR_SMOG,Moves.CLEAR_SMOG]);

      await game.startBattle([Species.BLASTOISE]);

      const leadPokemon = game.scene.getPlayerPokemon();
      expect(leadPokemon).toBeDefined();

      const enemyPokemon = game.scene.getEnemyPokemon();
      expect(enemyPokemon).toBeDefined();

      leadPokemon.addTag(BattlerTagType.SUBSTITUTE, null, null, leadPokemon.id);

      game.doAttack(getMovePosition(game.scene, 0, Moves.SWORDS_DANCE));

      await game.phaseInterceptor.to(BerryPhase, false);

      expect(leadPokemon.summonData.battleStats[BattleStat.ATK]).toBe(2);
    }, TIMEOUT
  );
});

import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import Phaser from "phaser";
import GameManager from "#test/utils/gameManager";
import { Abilities } from "#app/enums/abilities";
import { Moves } from "#app/enums/moves";
import { Species } from "#app/enums/species";
import { BerryPhase } from "#app/phases/berry-phase";
import { MoveResult } from "#app/field/pokemon";
import { Type } from "#app/data/type";
import { MoveEffectPhase } from "#app/phases/move-effect-phase";
import { StatusEffect } from "#app/enums/status-effect";

const TIMEOUT = 20 * 1000;

describe("Moves - Powder", () => {
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
    game.override.battleType("single");

    game.override
      .enemySpecies(Species.SNORLAX)
      .enemyLevel(100)
      .enemyMoveset(Array(4).fill(Moves.EMBER))
      .enemyAbility(Abilities.INSOMNIA)
      .startingLevel(100)
      .moveset([Moves.POWDER, Moves.SPLASH, Moves.FIERY_DANCE]);
  });

  it(
    "should cancel the target's Fire-type move and damage the target",
    async () => {
      await game.classicMode.startBattle([Species.CHARIZARD]);

      const enemyPokemon = game.scene.getEnemyPokemon()!;

      game.move.select(Moves.POWDER);

      await game.phaseInterceptor.to(BerryPhase, false);
      expect(enemyPokemon.getLastXMoves()[0].result).toBe(MoveResult.FAIL);
      expect(enemyPokemon.hp).toBe(Math.ceil(3 * enemyPokemon.getMaxHp() / 4));

      await game.toNextTurn();

      game.move.select(Moves.SPLASH);

      await game.phaseInterceptor.to(BerryPhase, false);
      expect(enemyPokemon.getLastXMoves()[0].result).toBe(MoveResult.SUCCESS);
      expect(enemyPokemon.hp).toBe(Math.ceil(3 * enemyPokemon.getMaxHp() / 4));
    }, TIMEOUT
  );

  it(
    "should have no effect against Grass-type Pokemon",
    async () => {
      game.override.enemySpecies(Species.AMOONGUSS);

      await game.classicMode.startBattle([Species.CHARIZARD]);

      const enemyPokemon = game.scene.getEnemyPokemon()!;

      game.move.select(Moves.POWDER);

      await game.phaseInterceptor.to(BerryPhase, false);
      expect(enemyPokemon.getLastXMoves()[0].result).toBe(MoveResult.SUCCESS);
      expect(enemyPokemon.hp).toBe(enemyPokemon.getMaxHp());
    }, TIMEOUT
  );

  it(
    "should have no effect against Pokemon with Overcoat",
    async () => {
      game.override.enemyAbility(Abilities.OVERCOAT);

      await game.classicMode.startBattle([Species.CHARIZARD]);

      const enemyPokemon = game.scene.getEnemyPokemon()!;

      game.move.select(Moves.POWDER);

      await game.phaseInterceptor.to(BerryPhase, false);
      expect(enemyPokemon.getLastXMoves()[0].result).toBe(MoveResult.SUCCESS);
      expect(enemyPokemon.hp).toBe(enemyPokemon.getMaxHp());
    }, TIMEOUT
  );

  it(
    "should not damage the target if the target has Magic Guard",
    async () => {
      game.override.enemyAbility(Abilities.MAGIC_GUARD);

      await game.classicMode.startBattle([Species.CHARIZARD]);

      const enemyPokemon = game.scene.getEnemyPokemon()!;

      game.move.select(Moves.POWDER);

      await game.phaseInterceptor.to(BerryPhase, false);
      expect(enemyPokemon.getLastXMoves()[0].result).toBe(MoveResult.FAIL);
      expect(enemyPokemon.hp).toBe(enemyPokemon.getMaxHp());
    }, TIMEOUT
  );

  it(
    "should not prevent the target from thawing out with Flame Wheel",
    async () => {
      game.override
        .enemyMoveset(Array(4).fill(Moves.FLAME_WHEEL))
        .enemyStatusEffect(StatusEffect.FREEZE);

      await game.classicMode.startBattle([Species.CHARIZARD]);

      const enemyPokemon = game.scene.getEnemyPokemon()!;

      game.move.select(Moves.POWDER);

      await game.phaseInterceptor.to(BerryPhase, false);
      expect(enemyPokemon.status?.effect).not.toBe(StatusEffect.FREEZE);
      expect(enemyPokemon.getLastXMoves()[0].result).toBe(MoveResult.FAIL);
      expect(enemyPokemon.hp).toBe(Math.ceil(3 * enemyPokemon.getMaxHp() / 4));
    }
  );

  it(
    "should not allow a target with Protean to change to Fire type",
    async () => {
      game.override.enemyAbility(Abilities.PROTEAN);

      await game.classicMode.startBattle([Species.CHARIZARD]);

      const enemyPokemon = game.scene.getEnemyPokemon()!;

      game.move.select(Moves.POWDER);

      await game.phaseInterceptor.to(BerryPhase, false);
      expect(enemyPokemon.getLastXMoves()[0].result).toBe(MoveResult.FAIL);
      expect(enemyPokemon.hp).toBeLessThan(enemyPokemon.getMaxHp());
      expect(enemyPokemon.summonData?.types).not.toBe(Type.FIRE);
    }, TIMEOUT
  );

  // TODO: Implement this interaction and enable this test
  it.skip(
    "should cancel Fire-type moves generated by the target's Dancer ability",
    async () => {
      game.override
        .enemySpecies(Species.BLASTOISE)
        .enemyAbility(Abilities.DANCER);

      await game.classicMode.startBattle([Species.CHARIZARD]);

      const playerPokemon = game.scene.getPlayerPokemon()!;
      const enemyPokemon = game.scene.getEnemyPokemon()!;

      game.move.select(Moves.FIERY_DANCE);

      await game.phaseInterceptor.to(MoveEffectPhase);
      const enemyStartingHp = enemyPokemon.hp;

      await game.phaseInterceptor.to(BerryPhase, false);
      // player should not take damage
      expect(playerPokemon.hp).toBe(playerPokemon.getMaxHp());
      // enemy should have taken damage from player's Fiery Dance + 2 Powder procs
      expect(enemyPokemon.hp).toBe(enemyStartingHp - 2*Math.floor(enemyPokemon.getMaxHp() / 4));
    }, TIMEOUT
  );

  it(
    "should cancel Revelation Dance if it becomes a Fire-type move",
    async () => {
      game.override
        .enemySpecies(Species.CHARIZARD)
        .enemyMoveset(Array(4).fill(Moves.REVELATION_DANCE));

      await game.classicMode.startBattle([Species.CHARIZARD]);

      const enemyPokemon = game.scene.getEnemyPokemon()!;

      game.move.select(Moves.POWDER);

      await game.phaseInterceptor.to(BerryPhase, false);
      expect(enemyPokemon.getLastXMoves()[0].result).toBe(MoveResult.FAIL);
      expect(enemyPokemon.hp).toBe(Math.ceil(3 * enemyPokemon.getMaxHp() / 4));
    }, TIMEOUT
  );

  it(
    "should cancel Shell Trap and damage the target, even if the move would fail",
    async () => {
      game.override.enemyMoveset(Array(4).fill(Moves.SHELL_TRAP));

      await game.classicMode.startBattle([Species.CHARIZARD]);

      const enemyPokemon = game.scene.getEnemyPokemon()!;

      game.move.select(Moves.POWDER);

      await game.phaseInterceptor.to(BerryPhase, false);
      expect(enemyPokemon.getLastXMoves()[0].result).toBe(MoveResult.FAIL);
      expect(enemyPokemon.hp).toBe(Math.ceil(3 * enemyPokemon.getMaxHp() / 4));
    }, TIMEOUT
  );
});

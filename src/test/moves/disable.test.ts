import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import GameManager from "../utils/gameManager";
import { getMovePosition } from "../utils/gameManagerUtils";
import { Moves } from "#app/enums/moves.js";
import { Species } from "#app/enums/species.js";
import { Abilities } from "#app/enums/abilities.js";
import { BerryPhase, TurnEndPhase } from "#app/phases.js";
import { MoveResult } from "#app/field/pokemon.js";

const TIMEOUT = 20 * 1000;

describe("Moves - Disable", () => {
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

    game.override
      .battleType("single")
      .startingLevel(100)
      .moveset([Moves.SPLASH, Moves.TACKLE])
      .enemySpecies(Species.SNORLAX)
      .enemyLevel(100)
      .enemyAbility(Abilities.INSOMNIA)
      .enemyMoveset(Array(4).fill(Moves.DISABLE))
      .disableCrits();
  });

  it(
    "should disable the target's last used move",
    async () => {
      await game.startBattle([Species.CHARIZARD]);

      const leadPokemon = game.scene.getPlayerPokemon();

      game.doAttack(getMovePosition(game.scene, 0, Moves.TACKLE));

      await game.phaseInterceptor.to(TurnEndPhase);

      expect(leadPokemon.isMoveDisabled(Moves.TACKLE)).toBeTruthy();
    }, TIMEOUT
  );

  it(
    "should fail if the target hasn't used a move",
    async () => {
      await game.startBattle([Species.SHUCKLE]);

      const enemyPokemon = game.scene.getEnemyPokemon();

      game.doAttack(getMovePosition(game.scene, 0, Moves.SPLASH));

      await game.phaseInterceptor.to(BerryPhase, false);
      expect(enemyPokemon.getLastXMoves()[0]?.result).toBe(MoveResult.FAIL);
    }, TIMEOUT
  );

  it(
    "should fail if the target has already been disabled",
    async () => {
      await game.startBattle([Species.CHARIZARD]);

      const enemyPokemon = game.scene.getEnemyPokemon();

      game.doAttack(getMovePosition(game.scene, 0, Moves.SPLASH));

      await game.phaseInterceptor.to(TurnEndPhase);

      game.doAttack(getMovePosition(game.scene, 0, Moves.TACKLE));

      await game.phaseInterceptor.to(BerryPhase, false);
      expect(enemyPokemon.getLastXMoves()[0]?.result).toBe(MoveResult.FAIL);
    }, TIMEOUT
  );

  it(
    "should fail if the target's last move was Struggle",
    async () => {
      game.override.moveset([Moves.STRUGGLE]);

      await game.startBattle([Species.CHARIZARD]);

      const leadPokemon = game.scene.getPlayerPokemon();
      const enemyPokemon = game.scene.getEnemyPokemon();

      game.doAttack(getMovePosition(game.scene, 0, Moves.STRUGGLE));

      await game.phaseInterceptor.to(TurnEndPhase);
      expect(enemyPokemon.getLastXMoves()[0]?.result).toBe(MoveResult.FAIL);
      expect(leadPokemon.isMoveDisabled(Moves.STRUGGLE)).toBeFalsy();
    }, TIMEOUT
  );
});

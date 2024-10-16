import BattleScene from "#app/battle-scene";
import { BattlerIndex } from "#app/battle";
import { applyAbAttrs, applyPostSummonAbAttrs, CommanderAbAttr, PostSummonAbAttr } from "#app/data/ability";
import { ArenaTrapTag } from "#app/data/arena-tag";
import { StatusEffect } from "#app/enums/status-effect";
import { PokemonPhase } from "./pokemon-phase";
import { MysteryEncounterPostSummonTag } from "#app/data/battler-tags";
import { BattlerTagType } from "#enums/battler-tag-type";

export class PostSummonPhase extends PokemonPhase {
  constructor(scene: BattleScene, battlerIndex: BattlerIndex) {
    super(scene, battlerIndex);
  }

  start() {
    super.start();

    const pokemon = this.getPokemon();

    if (pokemon.status?.effect === StatusEffect.TOXIC) {
      pokemon.status.turnCount = 0;
    }
    this.scene.arena.applyTags(ArenaTrapTag, false, pokemon);

    // If this is mystery encounter and has post summon phase tag, apply post summon effects
    if (this.scene.currentBattle.isBattleMysteryEncounter() && pokemon.findTags(t => t instanceof MysteryEncounterPostSummonTag).length > 0) {
      pokemon.lapseTag(BattlerTagType.MYSTERY_ENCOUNTER_POST_SUMMON);
    }

    applyPostSummonAbAttrs(PostSummonAbAttr, pokemon).then(() => this.end());

    const field = pokemon.isPlayer() ? this.scene.getPlayerField() : this.scene.getEnemyField();
    field.forEach((p) => applyAbAttrs(CommanderAbAttr, p, null, false));
  }
}

import { SimpleTranslationEntries } from "#app/interfaces/locales";

export const modifier: SimpleTranslationEntries = {
  "surviveDamageApply": "{{pokemonNameWithAffix}}は\n{{typeName}}で　もちこたえた！",
  "turnHealApply": "{{pokemonNameWithAffix}}は\n{{typeName}}で　少し　回復！",
  "hitHealApply": "{{pokemonNameWithAffix}}は\n{{typeName}}で　少し　回復！",
  "pokemonInstantReviveApply": "{{pokemonNameWithAffix}}は\n{{typeName}}で　復活した！",
  "pokemonResetNegativeStatStageApply": "{{pokemonNameWithAffix}}は　{{typeName}}で\n下がった能力が　元に戻った！",
  "moneyInterestApply": "{{typeName}}から　{{moneyAmount}}円　取得した！",
  "turnHeldItemTransferApply": "{{pokemonName}}の {{typeName}}が\n{{pokemonNameWithAffix}}の {{itemName}}を 吸い取った！",
  "contactHeldItemTransferApply": "{{pokemonName}}の {{typeName}}が\n{{pokemonNameWithAffix}}の {{itemName}}を うばい取った！",
  "enemyTurnHealApply": "{{pokemonNameWithAffix}}は\n体力を　回復！",
  "bypassSpeedChanceApply": "{{pokemonName}}は　{{itemName}}で\n行動が　はやくなった！",
} as const;

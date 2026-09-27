export { applyFilterCriteria } from './applyFilterCriteria';
export { summarizeCategories, priceBounds } from './catalogSummary';
export type { CategorySummary } from './catalogSummary';
export {
  compareKits,
  comparableKits,
  findByVariantId,
  includedInIndex,
  kitsContaining,
  kitsIn,
  looseProductsIn,
  relatedProducts,
  resolveContents,
} from './kits';
export type { KitComparisonRow, ResolvedContentLine } from './kits';
export { builderBases, builderGroups, builderPresets, builderTotal } from './kitBuilder';
export type { BuilderGroup, BuilderLine, BuilderPreset } from './kitBuilder';
export { isPeopleOption, peopleCount, peopleOption, variantOptionLabel } from './variants';

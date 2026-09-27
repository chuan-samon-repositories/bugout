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
export { isPeopleOption, peopleCount, peopleOption, variantOptionLabel } from './variants';

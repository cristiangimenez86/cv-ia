import sectionIdsJson from "../../../shared/section-ids.json";

/** CV section anchor IDs (order matches `content/site.json` and backend `CvMarkdownSectionIds`). */
export const CV_SECTION_IDS: readonly string[] = sectionIdsJson;

export const CV_SECTION_ID_SET = new Set<string>(CV_SECTION_IDS);

# Clinical Workspace

Operate mode: prioritize upload, image inspection and scanning patient records.

Use neutral green-gray surfaces and teal for actions. Rose and amber describe sample risk states, never decorate general navigation. Headings are 24px, body controls 14px, supporting context 12px. Use system fonts with no external font request, tabular numeric data and zero letter spacing.

Surfaces use a single border and 6px radius. Metrics form a divided strip. Forms and reports use unframed internal rows rather than nested cards. Shadows, decorative gradients, glass panels, generated clinical imagery and continuous animations are excluded.

Light and dark tokens live in src/index.css and tailwind.config.js. Theme state is shared through useSyncExternalStore and does not key or remount the route tree. All prediction and analytics values remain explicitly illustrative, except the Upload Dataset predictions and the measured model results, which come from models trained on the WDBC dataset.

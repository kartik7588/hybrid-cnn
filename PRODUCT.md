# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Product Purpose

Breast imaging frontend demonstration with scan upload, sample predictions, patient history, reports, analytics and local preferences. The Upload Dataset page runs Logistic regression, SVM and MLP models trained on the Wisconsin Diagnostic Breast Cancer (WDBC) numeric data through a local Python prediction API.

## Capabilities and Constraints

Preserve the existing routes and interactions. Use Vite, React, Tailwind and existing dependencies. Upload Dataset predictions come from real models trained on WDBC, with measured results on a held-out test set of 114 patients; any two of the three models can be combined by averaging their probabilities. All other pages (scan upload and results, dashboard, patient history, reports, analytics, settings) use sample or illustrative values. No authentication service, patient database or image model is present, and nothing is clinically validated. Never present illustrative values as clinical evidence.

## Brand Commitments

The user requested a restrained clinical interface, neutral surfaces, readable typography, subtle dividers and a teal accent. Status colors must have semantic meaning.

## Accessibility

Keyboard operation, visible focus, accessible labels, reduced motion and responsive layouts are required. Theme changes must preserve state.

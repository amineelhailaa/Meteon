# Meteo Coding Guide

This file defines how we write code in this project.

## Core rules

- Use **Composition API only** for Vue logic.
- Use **Axios only** for HTTP requests (do not use `fetch` for weather data calls).
- Do **not** add application logging (`console.log`, custom logger, verbose traces) in feature code.

## Vue standard

Use `<script setup>` and Composition API patterns:

- `ref`, `computed`, `watch`, `onMounted`
- composables for reusable logic
- no Options API (`data`, `methods`, `mounted`, etc.)

## HTTP standard

- Centralize API calls in a dedicated service/composable (example: `src/services/weatherApi.js`).
- Handle loading and error states in the component/composable.
- Read WeatherAPI settings from `.env` via `import.meta.env`.

## Weather API references

- Base URL: `http://api.weatherapi.com/v1`
- API key: `2b7437324a0a4c8db80113132260304`
- Env variables:
  - `VITE_WEATHER_API_BASE_URL=http://api.weatherapi.com/v1`
  - `VITE_WEATHER_API_KEY=2b7437324a0a4c8db80113132260304`
- Source: `https://www.weatherapi.com/my/`
- Swagger docs: `https://app.swaggerhub.com/apis-docs/WeatherAPI.com/WeatherAPI/1.0.2`
- Official docs: `https://www.weatherapi.com/docs/`

## Team checklist before merge

- [ ] Composition API used everywhere
- [ ] Axios used for all remote requests
- [ ] No application logging left in code
- [ ] API integration follows WeatherAPI docs


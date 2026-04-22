import axios from 'axios'

const baseURL = import.meta.env.VITE_WEATHER_API_BASE_URL
const apiKey = import.meta.env.VITE_WEATHER_API_KEY

if (!baseURL) {
  throw new Error('Missing VITE_WEATHER_API_BASE_URL')
}

if (!apiKey) {
  throw new Error('Missing VITE_WEATHER_API_KEY')
}

export const weatherApi = axios.create({
  baseURL,
  params: {
    key: apiKey,
  },
})


import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export const fetchCategories = async () => (await axios.get(`${API}/categories`)).data;
export const fetchArticles = async (params = {}) =>
  (await axios.get(`${API}/articles`, { params })).data;
export const fetchFeatured = async () => (await axios.get(`${API}/articles/featured`)).data;
export const fetchArticle = async (slug) => (await axios.get(`${API}/articles/${slug}`)).data;
export const fetchManifest = async () => (await axios.get(`${API}/manifest`)).data;
export const postContact = async (payload) => (await axios.post(`${API}/contact`, payload)).data;

export const LEVEL_LABELS = {
  beginner: "Essential",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

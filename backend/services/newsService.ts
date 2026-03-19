import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

let lastNewsCache: any[] = [];

export const fetchFloodNews = async (city: string = 'Sangli') => {
  try {
    const apiKey = process.env.NEWS_API_KEY;
    if (!apiKey || apiKey === "") {
      console.warn('News API key missing, using mock news');
      return [
        { title: "Heavy rains alert in Maharashtra", description: "IMD predicts heavy rainfall in Sangli and Kolhapur regions.", url: "#", urlToImage: "https://picsum.photos/seed/flood/800/600" },
        { title: "Flood safety measures updated", description: "New guidelines released for river-side residents.", url: "#", urlToImage: "https://picsum.photos/seed/safety/800/600" }
      ];
    }

    const queries = [
      `${city} flood OR rain`,
      `Maharashtra flood OR rain`,
      `India flood OR weather`
    ];

    let articles: any[] = [];

    for (const q of queries) {
      console.log("Trying query:", q);

      try {
        const response = await axios.get(
          `https://newsapi.org/v2/everything?q=${encodeURIComponent(q)}&sortBy=publishedAt&pageSize=10&apiKey=${apiKey}`
        );

        if (response.data.articles && response.data.articles.length > 0) {
          articles = response.data.articles;
          console.log("Using news from:", q);
          break;
        }
      } catch (err) {
        console.error(`Error fetching news for query ${q}:`, (err as Error).message);
      }
    }

    if (articles.length > 0) {
      // Process and deduplicate articles
      const processedArticles = articles.map((a: any) => ({
        title: a.title,
        description: a.description,
        url: a.url,
        urlToImage: a.urlToImage || `https://picsum.photos/seed/${encodeURIComponent(a.title)}/800/600`,
        publishedAt: a.publishedAt
      }));

      // Deduplicate by title
      const uniqueArticles = Array.from(new Map(processedArticles.map(item => [item.title, item])).values());
      
      // Sort by latest
      uniqueArticles.sort((a: any, b: any) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

      articles = uniqueArticles.slice(0, 10);
      lastNewsCache = articles;
    } else {
      console.warn("No new news found in any query, using cache");
      articles = lastNewsCache;
    }

    return articles.slice(0, 10);
  } catch (error) {
    console.error(`News API error: ${(error as Error).message}`);
    return lastNewsCache.length > 0 ? lastNewsCache : [];
  }
};

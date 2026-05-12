export const UPSC_KEYWORDS = [
  "bill", "court", "supreme court", "inflation", "un", "biodiversity",
  "government", "policy", "parliament", "amendment", "gdp", "rbi",
  "election", "tribunal", "constitutional", "ministry", "budget",
  "treaty", "climate", "isro", "defense", "trade"
];

export const isUpscRelevant = (article) => {
    if (!article.title && !article.content) return false;
    const text = `${article.title || ''} ${article.content || ''}`.toLowerCase();
    
    let matchCount = 0;
    for (const kw of UPSC_KEYWORDS) {
        if (text.includes(kw.toLowerCase())) {
            matchCount++;
        }
    }
    
    return matchCount >= 1;
};

export const filterUpscArticles = (articles) => {
    return articles.filter(isUpscRelevant);
};

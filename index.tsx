/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { GoogleGenAI } from '@google/genai';
import { marked } from 'marked';

// --- DOM ELEMENTS ---
// Tabs
const analystTab = document.getElementById('analyst-tab') as HTMLButtonElement;
const competitorTab = document.getElementById('competitor-tab') as HTMLButtonElement;
const keywordTab = document.getElementById('keyword-tab') as HTMLButtonElement;
const optimizerTab = document.getElementById('optimizer-tab') as HTMLButtonElement;
const scriptTab = document.getElementById('script-tab') as HTMLButtonElement;
const thumbnailTab = document.getElementById('thumbnail-tab') as HTMLButtonElement;
const tagTab = document.getElementById('tag-tab') as HTMLButtonElement;
const rankTrackerTab = document.getElementById('rank-tracker-tab') as HTMLButtonElement;

const analystPanel = document.getElementById('channel-analyst-panel') as HTMLDivElement;
const competitorPanel = document.getElementById('competitor-panel') as HTMLDivElement;
const keywordPanel = document.getElementById('keyword-research-panel') as HTMLDivElement;
const optimizerPanel = document.getElementById('optimizer-panel') as HTMLDivElement;
const scriptPanel = document.getElementById('script-panel') as HTMLDivElement;
const thumbnailPanel = document.getElementById('thumbnail-panel') as HTMLDivElement;
const tagPanel = document.getElementById('tag-panel') as HTMLDivElement;
const rankTrackerPanel = document.getElementById('rank-tracker-panel') as HTMLDivElement;

// Channel Analyst Elements
const channelInput = document.getElementById('channel-input') as HTMLInputElement;
const analyzeButton = document.getElementById('analyze-button') as HTMLButtonElement;

// Competitor Analysis Elements
const yourChannelInput = document.getElementById('your-channel-input') as HTMLInputElement;
const competitorChannelInput = document.getElementById('competitor-channel-input') as HTMLInputElement;
const compareButton = document.getElementById('compare-button') as HTMLButtonElement;

// Keyword Research Elements
const keywordInput = document.getElementById('keyword-input') as HTMLInputElement;
const researchButton = document.getElementById('research-button') as HTMLButtonElement;

// Optimizer Elements
const topicInput = document.getElementById('topic-input') as HTMLInputElement;
const titleInput = document.getElementById('title-input') as HTMLInputElement;
const descriptionInput = document.getElementById('description-input') as HTMLTextAreaElement;
const optimizeButton = document.getElementById('optimize-button') as HTMLButtonElement;

// Script Writer Elements
const scriptTopicInput = document.getElementById('script-topic-input') as HTMLInputElement;
const scriptAudienceInput = document.getElementById('script-audience-input') as HTMLInputElement;
const scriptToneSelect = document.getElementById('script-tone-select') as HTMLSelectElement;
const scriptPointsInput = document.getElementById('script-points-input') as HTMLTextAreaElement;
const generateScriptButton = document.getElementById('generate-script-button') as HTMLButtonElement;

// Thumbnail Analyzer Elements
const videoUrlInput = document.getElementById('video-url-input') as HTMLInputElement;
const analyzeThumbnailButton = document.getElementById('analyze-thumbnail-button') as HTMLButtonElement;
const thumbnailPreviewContainer = document.getElementById('thumbnail-preview-container') as HTMLDivElement;

// Tag Generator Elements
const tagTopicInput = document.getElementById('tag-topic-input') as HTMLInputElement;
const generateTagsButton = document.getElementById('generate-tags-button') as HTMLButtonElement;

// Rank Tracker Elements
const rankVideoUrlInput = document.getElementById('rank-video-url-input') as HTMLInputElement;
const rankKeywordInput = document.getElementById('rank-keyword-input') as HTMLInputElement;
const trackRankButton = document.getElementById('track-rank-button') as HTMLButtonElement;

// Shared UI Elements
const loader = document.getElementById('loader') as HTMLDivElement;
const channelHeader = document.getElementById('channel-header') as HTMLDivElement;
const statsContainer = document.getElementById('stats-container') as HTMLDivElement;
const resultContainer = document.getElementById('result-container') as HTMLDivElement;
const sourcesContainer = document.getElementById('sources-container') as HTMLDivElement;

// --- GEMINI API ---
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- FUNCTIONS ---

/**
 * Resets all result displays to their initial hidden state.
 */
function clearResults() {
  channelHeader.innerHTML = '';
  channelHeader.style.display = 'none';
  statsContainer.innerHTML = '';
  statsContainer.style.display = 'none';
  resultContainer.innerHTML = '';
  resultContainer.style.display = 'none';
  sourcesContainer.innerHTML = '';
  sourcesContainer.style.display = 'none';
  thumbnailPreviewContainer.innerHTML = '';
  thumbnailPreviewContainer.style.display = 'none';
  // Remove dynamically added copy button if it exists
  const existingCopyButton = document.querySelector('.copy-button-container');
  if (existingCopyButton) {
    existingCopyButton.remove();
  }
}

/**
 * Analyzes a YouTube channel using Google Search grounding.
 */
async function analyzeChannel() {
  const channelName = channelInput.value.trim();
  if (!channelName) {
    resultContainer.innerHTML = '<p class="error">Please enter a YouTube channel name.</p>';
    resultContainer.style.display = 'block';
    return;
  }

  // UI updates for loading state
  analyzeButton.disabled = true;
  loader.style.display = 'block';
  clearResults();

  const prompt = `
    Analyze the YouTube channel: "${channelName}".

    IMPORTANT: You must provide your response in three distinct sections separated by '---'.

    SECTION 1: CHANNEL IDENTITY
    Your first task is to find the official name and logo for the YouTube channel using Google Search. Present the information EXACTLY as follows. Do not add any extra text, explanations, or markdown formatting around the URL.
    - **Official Name:** [The exact official name of the channel]
    - **Logo URL:** [A single, direct, raw HTTPS URL to the channel's logo image. The URL must end in .jpg, .png, or .webp. Example: https://yt3.ggpht.com/some-id.jpg]
    ---

    SECTION 2: KEY STATISTICS
    Next, find and find the key statistics in this exact format:
    - **Subscribers:** [Number]
    - **Total Views:** [Number]
    - **Total Videos:** [Number]
    ---

    SECTION 3: CHANNEL ANALYSIS
    Finally, provide a concise analysis in Markdown format covering the following points:
    
    ### 📝 Content Summary
    - Briefly describe the main topics and content style of the channel.
    
    ### 🎯 Target Audience
    - Describe the likely target audience, including their interests and demographics.
    
    ### 🚀 Growth Suggestions
    - Offer 3 specific, actionable suggestions for content or strategy that could help the channel grow.
  `;

  try {
    const responseStream = await ai.models.generateContentStream({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    let fullText = '';
    const sourceMap = new Map<string, string>(); // uri -> title

    for await (const chunk of responseStream) {
      fullText += chunk.text;

      const parts = fullText.split('\n---\n');
      const channelInfoMarkdown = parts[0];
      const statsMarkdown = parts.length > 1 ? parts[1] : '';
      const analysisMarkdown = parts.length > 2 ? parts.slice(2).join('\n---\n') : '';
      
      if (channelInfoMarkdown) {
        const nameMatch = channelInfoMarkdown.match(/\*\*Official Name:\*\*\s*(.*)/);
        const logoLineMatch = channelInfoMarkdown.match(/\*\*Logo URL:\*\*\s*(.*)/);
        
        const officialChannelName = nameMatch ? nameMatch[1].trim() : '';
        let logoUrl = '';

        if (logoLineMatch && logoLineMatch[1]) {
          const rawLogoString = logoLineMatch[1].trim();
          const urlMatch = rawLogoString.match(/https?:\/\/[^\s<>"']+/);
          if (urlMatch && urlMatch[0]) {
            logoUrl = urlMatch[0];
          }
        }

        if (logoUrl && officialChannelName) {
            channelHeader.innerHTML = `
                <img src="${logoUrl}" alt="Logo for ${officialChannelName}">
                <h2>${officialChannelName}</h2>
            `;
            channelHeader.style.display = 'flex';
        }
      }

      if (statsMarkdown) {
        // Custom parsing and rendering for stats to achieve the desired design
        const statsHtml = marked(statsMarkdown) as string;
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = statsHtml;
        const listItems = tempDiv.querySelectorAll('li');
        let finalStatsHtml = '<ul>';
        listItems.forEach(li => {
            const strongEl = li.querySelector('strong');
            if (strongEl) {
                const label = strongEl.textContent || '';
                // The value is the text node after the <strong> element
                const value = strongEl.nextSibling?.textContent?.trim() || '';
                if (label && value) {
                    finalStatsHtml += `<li><span class="stat-value">${value}</span><span class="stat-label">${label}</span></li>`;
                } else {
                    finalStatsHtml += `<li>${li.innerHTML}</li>`;
                }
            } else {
                finalStatsHtml += `<li>${li.innerHTML}</li>`;
            }
        });
        finalStatsHtml += '</ul>';
    
        statsContainer.innerHTML = finalStatsHtml;
        statsContainer.style.display = 'block';
      }

      if (analysisMarkdown) {
        resultContainer.innerHTML = marked(analysisMarkdown) as string;
        resultContainer.style.display = 'block';
      }

      const chunks = chunk.candidates?.[0]?.groundingMetadata?.groundingChunks;
      if (chunks) {
        chunks.forEach(chunk => {
          if (chunk.web && chunk.web.uri) {
             if (!sourceMap.has(chunk.web.uri)) {
               sourceMap.set(chunk.web.uri, chunk.web.title || chunk.web.uri);
             }
          }
        });
      }
    }

    if (sourceMap.size > 0) {
      sourcesContainer.style.display = 'block';
      let sourcesHtml = '<h4>Sources from Google Search:</h4><ul>';
      for (const [uri, title] of sourceMap.entries()) {
        sourcesHtml += `<li><a href="${uri}" target="_blank" rel="noopener noreferrer">${title}</a></li>`;
      }
      sourcesHtml += '</ul>';
      sourcesContainer.innerHTML = sourcesHtml;
    }

  } catch (error) {
    console.error('Error during analysis:', error);
    resultContainer.innerHTML = `<p class="error">An error occurred while analyzing the channel. Please check the console for details.</p>`;
    resultContainer.style.display = 'block';
  } finally {
    loader.style.display = 'none';
    analyzeButton.disabled = false;
  }
}

/**
 * Compares two YouTube channels.
 */
async function analyzeCompetitors() {
    const yourChannel = yourChannelInput.value.trim();
    const competitorChannel = competitorChannelInput.value.trim();

    if (!yourChannel || !competitorChannel) {
        resultContainer.innerHTML = '<p class="error">Please enter both your channel and a competitor\'s channel name.</p>';
        resultContainer.style.display = 'block';
        return;
    }

    // UI updates for loading state
    compareButton.disabled = true;
    loader.style.display = 'block';
    clearResults();

    const prompt = `
      You are an expert YouTube strategist.
      Conduct a detailed, head-to-head competitive analysis of two YouTube channels using Google Search for the most current information.

      - **My Channel:** "${yourChannel}"
      - **Competitor's Channel:** "${competitorChannel}"

      Present your analysis in Markdown format with the following sections:

      ### 📊 Overall Summary
      - Briefly summarize each channel's niche, size (subscribers/views), and overall standing.

      ### 🎬 Content Strategy Comparison
      - **Topics & Niche:** What core topics does each channel cover? How similar or different are their niches?
      - **Video Formats:** Compare the types of videos they produce (e.g., tutorials, reviews, vlogs, interviews).
      - **Posting Frequency:** How often does each channel upload new content?

      ### 💬 Audience Engagement Comparison
      - **Community Interaction:** Analyze how each channel engages with its audience in comments, community posts, etc.
      - **Tone & Style:** Describe the personality and tone of each channel. Is it educational, entertaining, formal, casual?

      ### 💪 Strengths & Weaknesses
      **${yourChannel} (My Channel):**
      - **Strengths:** [List 2-3 key strengths]
      - **Weaknesses:** [List 2-3 potential areas for improvement]

      **${competitorChannel} (Competitor):**
      - **Strengths:** [List 2-3 key strengths]
      - **Weaknesses:** [List 2-3 potential areas for improvement]

      ### 🚀 Actionable Takeaways for "${yourChannel}"
      - Based on this analysis, provide 3-4 specific, actionable suggestions that "${yourChannel}" can implement to improve its content strategy, gain a competitive edge, and attract more viewers.
    `;
    
    try {
        const responseStream = await ai.models.generateContentStream({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                tools: [{ googleSearch: {} }],
            },
        });

        let fullText = '';
        const sourceMap = new Map<string, string>();
        resultContainer.style.display = 'block';

        for await (const chunk of responseStream) {
            fullText += chunk.text;
            resultContainer.innerHTML = marked(fullText) as string;

            const chunks = chunk.candidates?.[0]?.groundingMetadata?.groundingChunks;
            if (chunks) {
                chunks.forEach(chunk => {
                    if (chunk.web && chunk.web.uri) {
                        if (!sourceMap.has(chunk.web.uri)) {
                            sourceMap.set(chunk.web.uri, chunk.web.title || chunk.web.uri);
                        }
                    }
                });
            }
        }
        
        if (sourceMap.size > 0) {
            sourcesContainer.style.display = 'block';
            let sourcesHtml = '<h4>Sources from Google Search:</h4><ul>';
            for (const [uri, title] of sourceMap.entries()) {
                sourcesHtml += `<li><a href="${uri}" target="_blank" rel="noopener noreferrer">${title}</a></li>`;
            }
            sourcesHtml += '</ul>';
            sourcesContainer.innerHTML = sourcesHtml;
        }

    } catch (error) {
        console.error('Error during competitor analysis:', error);
        resultContainer.innerHTML = `<p class="error">An error occurred during the analysis. Please check the console for details.</p>`;
        resultContainer.style.display = 'block';
    } finally {
        loader.style.display = 'none';
        compareButton.disabled = false;
    }
}


/**
 * Researches keywords for a given topic.
 */
async function researchKeywords() {
  const topic = keywordInput.value.trim();
  if (!topic) {
    resultContainer.innerHTML = '<p class="error">Please enter a topic for keyword research.</p>';
    resultContainer.style.display = 'block';
    return;
  }

  // UI updates for loading state
  researchButton.disabled = true;
  loader.style.display = 'block';
  clearResults();

  const prompt = `
    You are an expert YouTube SEO and content strategist.
    Your task is to generate a comprehensive list of keyword ideas and video titles for a YouTuber based on the following topic: "${topic}".

    Provide your response in Markdown format, organized into the following five sections:

    ### 🚀 High-Traffic Keywords
    - [List of 5-7 broad, popular keywords related to the topic]

    ### 🎯 Long-Tail Keywords
    - [List of 5-7 specific, niche phrases that users might search for]

    ### 🥊 "Vs." Keywords
    - [List of 3-5 comparison-style keywords, like "Topic A vs. Topic B"]

    ### 🤔 Question-Based Keywords
    - [List of 5-7 keywords phrased as questions, like "How to...", "What is...", "Why..."]

    ### 🎬 Catchy Video Titles
    - [List of 5-7 creative and engaging video title ideas based on the topic]
  `;

  try {
    const responseStream = await ai.models.generateContentStream({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    let fullText = '';
    resultContainer.style.display = 'block';
    
    for await (const chunk of responseStream) {
      fullText += chunk.text;
      resultContainer.innerHTML = marked(fullText) as string;
    }

  } catch (error) {
    console.error('Error during keyword research:', error);
    resultContainer.innerHTML = `<p class="error">An error occurred during keyword research. Please check the console for details.</p>`;
    resultContainer.style.display = 'block';
  } finally {
    loader.style.display = 'none';
    researchButton.disabled = false;
  }
}

/**
 * Optimizes a video title and description.
 */
async function optimizeContent() {
    const topic = topicInput.value.trim();
    const draftTitle = titleInput.value.trim();
    const draftDescription = descriptionInput.value.trim();

    if (!topic) {
        resultContainer.innerHTML = '<p class="error">Please enter a video topic or idea.</p>';
        resultContainer.style.display = 'block';
        return;
    }

    // UI updates for loading state
    optimizeButton.disabled = true;
    loader.style.display = 'block';
    clearResults();

    const prompt = `
        You are a world-class YouTube SEO expert and copywriter.
        Your task is to optimize a video's title and description based on the provided topic and any draft versions.

        **Video Topic:** "${topic}"
        **Draft Title:** "${draftTitle || 'Not provided'}"
        **Draft Description:** "${draftDescription || 'Not provided'}"

        Please provide your response in Markdown format with the following structure:

        ### 🎬 Optimized Title Suggestions
        - **Suggestion 1:** [First alternative title - make it catchy and keyword-rich]
        - **Suggestion 2:** [Second alternative title - try a different angle or hook]
        - **Suggestion 3:** [Third alternative title - perhaps a more direct, question-based title]

        ### 📝 Optimized Description
        [Rewrite the description completely. It should include:
        - A strong, engaging hook in the first 1-2 sentences.
        - A concise summary of the video's content, naturally weaving in keywords from the topic and title.
        - A call-to-action (e.g., "Subscribe for more!", "Check out our website!").
        - A section for relevant links (use placeholders like [Your Link Here]).
        - 3-5 relevant, researched hashtags at the end.]
    `;

    try {
        const responseStream = await ai.models.generateContentStream({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });

        let fullText = '';
        resultContainer.style.display = 'block';

        for await (const chunk of responseStream) {
            fullText += chunk.text;
            resultContainer.innerHTML = marked(fullText) as string;
        }

    } catch (error) {
        console.error('Error during content optimization:', error);
        resultContainer.innerHTML = `<p class="error">An error occurred during content optimization. Please check the console for details.</p>`;
        resultContainer.style.display = 'block';
    } finally {
        loader.style.display = 'none';
        optimizeButton.disabled = false;
    }
}

/**
 * Generates a video script.
 */
async function generateScript() {
    const topic = scriptTopicInput.value.trim();
    const audience = scriptAudienceInput.value.trim();
    const tone = scriptToneSelect.value;
    const points = scriptPointsInput.value.trim();

    if (!topic) {
        resultContainer.innerHTML = '<p class="error">Please enter a video topic.</p>';
        resultContainer.style.display = 'block';
        return;
    }

    // UI updates
    generateScriptButton.disabled = true;
    loader.style.display = 'block';
    clearResults();

    const prompt = `
        You are a professional YouTube screenwriter. 
        Write a structured video script for the following video idea.

        **Topic:** ${topic}
        **Target Audience:** ${audience || 'General YouTube Audience'}
        **Tone:** ${tone}
        **Key Points/Outline:** 
        ${points || 'Cover the most important aspects of the topic.'}

        **Script Structure:**
        1. **Hook (0:00-0:45):** A captivating opening to grab attention.
        2. **Intro:** Brief welcome and video roadmap.
        3. **Body:** Detailed sections (approx 3-4) covering the key points. Include [Visual Notes] for B-roll.
        4. **Conclusion & CTA:** Summary and call to subscribe/comment.

        Output using Markdown.
    `;

    try {
        const responseStream = await ai.models.generateContentStream({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });

        let fullText = '';
        resultContainer.style.display = 'block';

        for await (const chunk of responseStream) {
            fullText += chunk.text;
            resultContainer.innerHTML = marked(fullText) as string;
        }
    } catch (error) {
        console.error('Error during script generation:', error);
        resultContainer.innerHTML = `<p class="error">An error occurred during script generation.</p>`;
        resultContainer.style.display = 'block';
    } finally {
        loader.style.display = 'none';
        generateScriptButton.disabled = false;
    }
}

/**
 * Extracts a YouTube video ID from various URL formats.
 * @param {string} url The YouTube URL.
 * @returns {string|null} The video ID or null if not found.
 */
function extractVideoId(url: string): string | null {
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
}

/**
 * Fetches an image from a URL and converts it to a base64 string.
 * @param {string} imageUrl The URL of the image to fetch.
 * @returns {Promise<{base64: string, mimeType: string}>} The base64 string and mimeType.
 */
async function imageUrlToBase64(imageUrl: string): Promise<{base64: string, mimeType: string}> {
  const response = await fetch(imageUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${response.statusText}`);
  }
  const blob = await response.blob();
  const mimeType = blob.type;
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      // result is a data URL: "data:image/jpeg;base64,..."
      // We only need the part after the comma.
      const base64 = (reader.result as string).split(',')[1];
      resolve({ base64, mimeType });
    };
    reader.readAsDataURL(blob);
  });
}


/**
 * Analyzes a YouTube video thumbnail.
 */
async function analyzeThumbnail() {
    const url = videoUrlInput.value.trim();
    if (!url) {
        resultContainer.innerHTML = '<p class="error">Please enter a YouTube video URL.</p>';
        resultContainer.style.display = 'block';
        return;
    }
    const videoId = extractVideoId(url);
    if (!videoId) {
        resultContainer.innerHTML = '<p class="error">Could not find a valid YouTube video ID in the URL.</p>';
        resultContainer.style.display = 'block';
        return;
    }

    const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;

    // UI updates
    analyzeThumbnailButton.disabled = true;
    loader.style.display = 'block';
    // Clear previous results but keep the new thumbnail
    resultContainer.innerHTML = '';
    resultContainer.style.display = 'none';
    sourcesContainer.innerHTML = '';
    sourcesContainer.style.display = 'none';
    thumbnailPreviewContainer.innerHTML = `<img src="${thumbnailUrl}" alt="YouTube video thumbnail">`;
    thumbnailPreviewContainer.style.display = 'flex';

    try {
        const { base64, mimeType } = await imageUrlToBase64(thumbnailUrl);

        const imagePart = {
            inlineData: {
                data: base64,
                mimeType: mimeType
            },
        };
        const textPart = {
            text: `
You are an expert YouTube strategist and graphic designer with a keen eye for what makes a thumbnail successful.

Analyze the provided thumbnail image based on the following criteria. Provide your feedback in clear, actionable points using Markdown.

### 👀 First Impressions
- [Your immediate, gut reaction to the thumbnail in one or two sentences. What does it make you feel or think?]

### ✅ Strengths
- **Clarity & Focus:** [Is the subject of the video immediately clear? Is there a strong focal point?]
- **Emotional Appeal:** [Does the thumbnail evoke curiosity, excitement, or another emotion? How?]
- **Text & Readability:** [If there's text, is it easy to read on all devices? Is it concise and impactful?]
- **Branding:** [Is the style consistent with a potential brand? Is it recognizable?]

### 💡 Areas for Improvement
- [Provide 2-3 specific, constructive suggestions. For example: "Increase the contrast between the text and background," "Use a more expressive facial expression," or "Simplify the composition by removing the distracting element on the left."]

### 🧪 A/B Test Idea
- [Describe a concrete alternative version of this thumbnail that could be tested. For example: "Test a version with a bright yellow background instead of blue to see if it improves click-through rate."]
`
        };

        const responseStream = await ai.models.generateContentStream({
            model: 'gemini-2.5-flash', // Multimodal model
            contents: { parts: [textPart, imagePart] },
        });

        let fullText = '';
        resultContainer.style.display = 'block';

        for await (const chunk of responseStream) {
            fullText += chunk.text;
            resultContainer.innerHTML = marked(fullText) as string;
        }

    } catch (error) {
        console.error('Error during thumbnail analysis:', error);
        resultContainer.innerHTML = `<p class="error">An error occurred during thumbnail analysis. Please check the console for details.</p>`;
        resultContainer.style.display = 'block';
    } finally {
        loader.style.display = 'none';
        analyzeThumbnailButton.disabled = false;
    }
}

/**
 * Generates YouTube tags for a given topic.
 */
async function generateTags() {
    const topic = tagTopicInput.value.trim();
    if (!topic) {
        resultContainer.innerHTML = '<p class="error">Please enter a topic to generate tags for.</p>';
        resultContainer.style.display = 'block';
        return;
    }

    // UI updates for loading state
    generateTagsButton.disabled = true;
    loader.style.display = 'block';
    clearResults();

    const prompt = `
        You are a YouTube SEO expert specializing in video tagging.
        Based on the topic "${topic}", generate a list of highly effective tags to maximize discoverability.

        Please structure your response in two parts separated by '---'.

        PART 1: TAG LIST FOR COPYING
        Provide a single, comma-separated string of all the tags. Do not include any other text or formatting in this part.

        ---

        PART 2: TAGS BY CATEGORY (FOR DISPLAY)
        Provide the tags again, but this time organized into categories in Markdown format.

        ### 🎯 Core Tags
        - [List of 3-5 primary, broad keywords]

        ### 🔎 Specific / Long-Tail Tags
        - [List of 7-10 more specific phrases describing the video's content]

        ### ✨ Related / Niche Tags
        - [List of 3-5 related topics or niche keywords that the target audience might also be interested in]
    `;

    try {
        const responseStream = await ai.models.generateContentStream({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });

        let fullText = '';
        let tagsToCopy = '';
        resultContainer.style.display = 'block';

        for await (const chunk of responseStream) {
            fullText += chunk.text;
            
            const parts = fullText.split('---');
            const rawTags = parts[0].replace('PART 1: TAG LIST FOR COPYING', '').trim();
            tagsToCopy = rawTags.endsWith(',') ? rawTags.slice(0, -1) : rawTags;
            const markdownContent = parts.length > 1 ? parts[1].replace('PART 2: TAGS BY CATEGORY (FOR DISPLAY)', '').trim() : '';

            if (markdownContent) {
                resultContainer.innerHTML = marked(markdownContent) as string;
            }
        }
        
        if (tagsToCopy) {
            const copyButtonContainer = document.createElement('div');
            copyButtonContainer.className = 'copy-button-container';
            copyButtonContainer.innerHTML = `
                <button id="copy-tags-button" class="copy-button" title="Copy tags to clipboard">
                    <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>
                    <span>Copy Tags</span>
                </button>
            `;
            
            resultContainer.before(copyButtonContainer);

            const copyButton = document.getElementById('copy-tags-button') as HTMLButtonElement;
            copyButton?.addEventListener('click', () => {
                navigator.clipboard.writeText(tagsToCopy).then(() => {
                    const buttonSpan = copyButton.querySelector('span');
                    if(buttonSpan) buttonSpan.textContent = 'Copied!';
                    copyButton.classList.add('copied');
                    setTimeout(() => {
                        if(buttonSpan) buttonSpan.textContent = 'Copy Tags';
                        copyButton.classList.remove('copied');
                    }, 2000);
                }).catch(err => {
                    console.error('Failed to copy tags: ', err);
                });
            });
        }

    } catch (error) {
        console.error('Error during tag generation:', error);
        resultContainer.innerHTML = `<p class="error">An error occurred during tag generation. Please check the console for details.</p>`;
        resultContainer.style.display = 'block';
    } finally {
        loader.style.display = 'none';
        generateTagsButton.disabled = false;
    }
}

/**
 * Tracks the rank of a YouTube video for a specific keyword.
 */
async function trackRank() {
    const videoUrl = rankVideoUrlInput.value.trim();
    const keyword = rankKeywordInput.value.trim();

    if (!videoUrl || !keyword) {
        resultContainer.innerHTML = '<p class="error">Please enter both a video URL and a keyword to track.</p>';
        resultContainer.style.display = 'block';
        return;
    }

    // UI updates for loading state
    trackRankButton.disabled = true;
    loader.style.display = 'block';
    clearResults();

    const prompt = `
      You are an SEO expert specializing in YouTube video rankings.
      Your task is to determine the search rank of a specific YouTube video for a given keyword.

      - **Video URL:** "${videoUrl}"
      - **Keyword to search on YouTube:** "${keyword}"

      Instructions:
      1. Use Google Search to search ONLY on youtube.com for the keyword.
      2. Scan the search results to find the position of the specified video URL.
      3. Provide your answer in the following Markdown format:

      ### 📈 Rank Tracking Result

      - **Video:** [${videoUrl}](${videoUrl})
      - **Keyword:** "${keyword}"
      - **Current Rank:** [Provide the numerical rank here, e.g., "#5". If it's not in the top 50 results, state "Not found in top 50".]
    `;

    try {
        const responseStream = await ai.models.generateContentStream({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                tools: [{ googleSearch: {} }],
            },
        });

        let fullText = '';
        const sourceMap = new Map<string, string>();
        resultContainer.style.display = 'block';

        for await (const chunk of responseStream) {
            fullText += chunk.text;
            resultContainer.innerHTML = marked(fullText) as string;

            const chunks = chunk.candidates?.[0]?.groundingMetadata?.groundingChunks;
            if (chunks) {
                chunks.forEach(chunk => {
                    if (chunk.web && chunk.web.uri) {
                        if (!sourceMap.has(chunk.web.uri)) {
                            sourceMap.set(chunk.web.uri, chunk.web.title || chunk.web.uri);
                        }
                    }
                });
            }
        }
        
        if (sourceMap.size > 0) {
            sourcesContainer.style.display = 'block';
            let sourcesHtml = '<h4>Sources from Google Search:</h4><ul>';
            for (const [uri, title] of sourceMap.entries()) {
                sourcesHtml += `<li><a href="${uri}" target="_blank" rel="noopener noreferrer">${title}</a></li>`;
            }
            sourcesHtml += '</ul>';
            sourcesContainer.innerHTML = sourcesHtml;
        }

    } catch (error) {
        console.error('Error during rank tracking:', error);
        resultContainer.innerHTML = `<p class="error">An error occurred during rank tracking. Please check the console for details.</p>`;
        resultContainer.style.display = 'block';
    } finally {
        loader.style.display = 'none';
        trackRankButton.disabled = false;
    }
}

// --- EVENT LISTENERS ---
function setActiveTab(activeTab: HTMLButtonElement, activePanel: HTMLDivElement) {
    const tabs = [analystTab, competitorTab, keywordTab, optimizerTab, scriptTab, thumbnailTab, tagTab, rankTrackerTab];
    const panels = [analystPanel, competitorPanel, keywordPanel, optimizerPanel, scriptPanel, thumbnailPanel, tagPanel, rankTrackerPanel];

    tabs.forEach(tab => {
        const isSelected = tab === activeTab;
        tab.classList.toggle('active', isSelected);
        tab.setAttribute('aria-selected', isSelected.toString());
    });

    panels.forEach(panel => {
        panel.classList.toggle('active', panel === activePanel);
    });
    
    clearResults();
}


// Tab Switching
analystTab.addEventListener('click', () => setActiveTab(analystTab, analystPanel));
competitorTab.addEventListener('click', () => setActiveTab(competitorTab, competitorPanel));
keywordTab.addEventListener('click', () => setActiveTab(keywordTab, keywordPanel));
optimizerTab.addEventListener('click', () => setActiveTab(optimizerTab, optimizerPanel));
scriptTab.addEventListener('click', () => setActiveTab(scriptTab, scriptPanel));
thumbnailTab.addEventListener('click', () => setActiveTab(thumbnailTab, thumbnailPanel));
tagTab.addEventListener('click', () => setActiveTab(tagTab, tagPanel));
rankTrackerTab.addEventListener('click', () => setActiveTab(rankTrackerTab, rankTrackerPanel));

// Channel Analyst
analyzeButton.addEventListener('click', analyzeChannel);
channelInput.addEventListener('keyup', (event) => {
  if (event.key === 'Enter') {
    analyzeChannel();
  }
});

// Competitor Analysis
compareButton.addEventListener('click', analyzeCompetitors);
yourChannelInput.addEventListener('keyup', (event) => {
    if (event.key === 'Enter') {
      analyzeCompetitors();
    }
});
competitorChannelInput.addEventListener('keyup', (event) => {
    if (event.key === 'Enter') {
      analyzeCompetitors();
    }
});

// Keyword Research
researchButton.addEventListener('click', researchKeywords);
keywordInput.addEventListener('keyup', (event) => {
  if (event.key === 'Enter') {
    researchKeywords();
  }
});

// Optimizer
optimizeButton.addEventListener('click', optimizeContent);

// Script Writer
generateScriptButton.addEventListener('click', generateScript);

// Thumbnail Analyzer
analyzeThumbnailButton.addEventListener('click', analyzeThumbnail);
videoUrlInput.addEventListener('keyup', (event) => {
    if (event.key === 'Enter') {
        analyzeThumbnail();
    }
});
videoUrlInput.addEventListener('paste', () => {
  // Use a timeout to allow the paste event to complete and update the input's value
  setTimeout(() => {
    const url = videoUrlInput.value.trim();
    const videoId = extractVideoId(url);
    if (videoId) {
      const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
      thumbnailPreviewContainer.innerHTML = `<img src="${thumbnailUrl}" alt="YouTube video thumbnail">`;
      thumbnailPreviewContainer.style.display = 'flex';
    }
  }, 0);
});

// Tag Generator
generateTagsButton.addEventListener('click', generateTags);
tagTopicInput.addEventListener('keyup', (event) => {
    if (event.key === 'Enter') {
        generateTags();
    }
});

// Rank Tracker
trackRankButton.addEventListener('click', trackRank);
rankVideoUrlInput.addEventListener('keyup', (event) => {
    if (event.key === 'Enter') {
        trackRank();
    }
});
rankKeywordInput.addEventListener('keyup', (event) => {
    if (event.key === 'Enter') {
        trackRank();
    }
});
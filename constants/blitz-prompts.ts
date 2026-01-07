export const BLITZ_PROMPTS = [
  "Show us your current view",
  "Snap your shoes right now",
  "Closest blue object to you",
  "What's in your fridge?",
  "Your current drink",
  "Something that makes you smile",
  "Your workspace chaos",
  "Mirror selfie energy",
  "Pet or plant check",
  "What you're wearing today",
  "Sky outside your window",
  "Your favorite snack",
  "Something unexpected nearby",
  "Your go-to spot right now",
  "Weirdest thing in arm's reach",
  "Current mood in one photo",
  "Last thing you ate",
  "Your desk situation",
  "Something orange around you",
  "Your current vibe",
  "Show us your hands",
  "What's on your wall?",
  "Your phone screen",
  "Something you're grateful for",
  "Current lighting check",
  "Your keys or wallet",
  "Something nostalgic",
  "A silly face",
  "Your bag contents",
  "Shadow selfie",
  "Reflection photo",
  "Something tiny",
  "Your recent purchase",
  "Floor check",
  "Ceiling perspective",
  "Your favorite texture",
  "Something shiny",
  "What's behind you?",
  "Your current temp check",
  "Random page from a book"
];

export const getRandomPrompt = (excludePrompt?: string): string => {
  let availablePrompts = BLITZ_PROMPTS;
  
  if (excludePrompt) {
    availablePrompts = BLITZ_PROMPTS.filter(p => p !== excludePrompt);
  }
  
  const randomIndex = Math.floor(Math.random() * availablePrompts.length);
  return availablePrompts[randomIndex];
};

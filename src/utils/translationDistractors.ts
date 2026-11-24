/**
 * Shared Anti-Elimination Translation Distractor Engine (ZH → EN & EN → ZH).
 *
 * Generates closely matched distractors that preserve sentence length, punctuation,
 * and thematic vocabulary while introducing realistic HSK 1 traps:
 * - Negation vs. affirmation (polarity)
 * - Tense / time markers & aspect (了 / 正在 / 要 / yesterday / tomorrow)
 * - Subject / object & pronoun swaps
 * - Subtle word-meaning, measure-word, question-word, and semantic-field traps
 *
 * When an ultra-short idiom yields fewer than 3 rule-based mutations, falls back
 * to similarity-ranked candidates (same chapter, matching punctuation, closest
 * length, and shared tokens) rather than unrelated random sentences.
 */

export interface SwapRule {
  pattern: RegExp;
  replacements: string[];
  tag: string;
}

export interface TranslationCandidate {
  id: string;
  chapterId?: number;
  hanzi: string;
  arabic: string;
}

export function shuffleWithRng<T>(items: T[], rng: () => number = Math.random): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export const ENGLISH_SWAP_RULES: SwapRule[] = [
  // Negation vs. Affirmation (Polarity traps — placed first so multi-word forms match cleanly)
  { pattern: /\bI am not\b/g, replacements: ['I am', 'He is not', 'She is not'], tag: 'polarity' },
  { pattern: /\bHe is not\b/g, replacements: ['He is', 'She is not', 'I am not'], tag: 'polarity' },
  { pattern: /\bShe is not\b/g, replacements: ['She is', 'He is not', 'I am not'], tag: 'polarity' },
  { pattern: /\bIt is not\b/g, replacements: ['It is', 'It was not'], tag: 'polarity' },
  { pattern: /\bI do not\b/g, replacements: ['I really', 'He does not', 'We do not'], tag: 'polarity' },
  { pattern: /\bI don't\b/g, replacements: ['I want to', "He doesn't", "We don't"], tag: 'polarity' },
  { pattern: /\bI did not\b/g, replacements: ['I already', 'He did not', 'We did not'], tag: 'polarity' },
  { pattern: /\bI didn't\b/g, replacements: ['I already', "He didn't", "We didn't"], tag: 'polarity' },
  { pattern: /\bdo not have\b/g, replacements: ['already have', 'still have'], tag: 'polarity' },
  { pattern: /\bdoes not have\b/g, replacements: ['already has', 'also has'], tag: 'polarity' },
  { pattern: /\bnot busy\b/g, replacements: ['very busy', 'a bit busy'], tag: 'polarity' },
  { pattern: /\bnot good\b/g, replacements: ['very good', 'quite good'], tag: 'polarity' },
  { pattern: /\bnot expensive\b/g, replacements: ['very expensive', 'too expensive'], tag: 'polarity' },
  { pattern: /\bnot cold\b/g, replacements: ['very cold', 'too cold'], tag: 'polarity' },
  { pattern: /\bnot hot\b/g, replacements: ['very hot', 'too hot'], tag: 'polarity' },
  { pattern: /\bvery busy\b/g, replacements: ['not busy', 'not very busy'], tag: 'polarity' },
  { pattern: /\bvery happy\b/g, replacements: ['not happy', 'not very happy'], tag: 'polarity' },
  { pattern: /\bvery glad\b/g, replacements: ['not very glad', 'also sorry'], tag: 'polarity' },
  { pattern: /\bvery delicious\b/g, replacements: ['not very delicious', 'too salty'], tag: 'polarity' },
  { pattern: /\breally delicious\b/g, replacements: ['not very delicious', 'a little bland'], tag: 'polarity' },
  { pattern: /\breally cheap\b/g, replacements: ['not very cheap', 'really expensive'], tag: 'polarity' },
  { pattern: /\bvery cheap\b/g, replacements: ['very expensive', 'not very cheap'], tag: 'polarity' },
  { pattern: /\btoo cold\b/g, replacements: ['not cold at all', 'too hot'], tag: 'polarity' },
  { pattern: /\btoo hot\b/g, replacements: ['not hot at all', 'too cold'], tag: 'polarity' },
  { pattern: /\bI can\b/g, replacements: ['I cannot', 'He can', 'She can'], tag: 'polarity' },
  { pattern: /\bI cannot\b/g, replacements: ['I can', 'He cannot', 'We cannot'], tag: 'polarity' },
  { pattern: /\bcan speak\b/g, replacements: ['cannot speak', 'want to learn'], tag: 'polarity' },
  { pattern: /\bcan cook\b/g, replacements: ['cannot cook', 'want to eat'], tag: 'polarity' },
  { pattern: /\bI want to\b/g, replacements: ['I do not want to', 'He wants to', 'We want to'], tag: 'polarity' },
  { pattern: /\bShe wants to\b/g, replacements: ['She does not want to', 'He wants to', 'I want to'], tag: 'polarity' },
  { pattern: /\bHe wants to\b/g, replacements: ['He does not want to', 'She wants to', 'I want to'], tag: 'polarity' },
  { pattern: /\bThey want to\b/g, replacements: ['They do not want to', 'We want to', 'He wants to'], tag: 'polarity' },
  { pattern: /\bWe want to\b/g, replacements: ['We do not want to', 'They want to', 'I want to'], tag: 'polarity' },
  { pattern: /\bShe likes\b/g, replacements: ['She does not like', 'He likes', 'I like'], tag: 'polarity' },
  { pattern: /\bHe likes\b/g, replacements: ['He does not like', 'She likes', 'I like'], tag: 'polarity' },
  { pattern: /\bShe can\b/g, replacements: ['She cannot', 'He can', 'I can'], tag: 'polarity' },
  { pattern: /\bHe can\b/g, replacements: ['He cannot', 'She can', 'I can'], tag: 'polarity' },
  { pattern: /\bI like\b/g, replacements: ['I do not like', 'He likes', 'She likes'], tag: 'polarity' },
  { pattern: /\bI love\b/g, replacements: ['I do not like', 'He loves', 'She loves'], tag: 'polarity' },
  { pattern: /\bI have\b/g, replacements: ['I do not have', 'He has', 'She has'], tag: 'polarity' },
  { pattern: /\bShe has\b/g, replacements: ['She does not have', 'He has', 'I have'], tag: 'polarity' },
  { pattern: /\bHe has\b/g, replacements: ['He does not have', 'She has', 'I have'], tag: 'polarity' },
  { pattern: /\blooks really nice\b/g, replacements: ['does not look very nice', 'looks quite old', 'looks very expensive'], tag: 'polarity' },
  { pattern: /\blooks very nice\b/g, replacements: ['does not look very nice', 'looks quite old', 'looks very expensive'], tag: 'polarity' },
  { pattern: /\bI watched\b/g, replacements: ['I did not watch', 'I will watch', 'He watched'], tag: 'tense' },
  { pattern: /\bI bought\b/g, replacements: ['I did not buy', 'I want to buy', 'He bought'], tag: 'tense' },
  { pattern: /\bI went\b/g, replacements: ['I did not go', 'I am going', 'He went'], tag: 'tense' },
  { pattern: /\bI ate\b/g, replacements: ['I did not eat', 'I want to eat', 'He ate'], tag: 'tense' },
  { pattern: /\bI drank\b/g, replacements: ['I did not drink', 'I want to drink', 'He drank'], tag: 'tense' },
  { pattern: /\bI am studying\b/g, replacements: ['I finished studying', 'I will study', 'He is studying'], tag: 'tense' },
  { pattern: /\bI am reading\b/g, replacements: ['I already read', 'I will read', 'He is reading'], tag: 'tense' },
  { pattern: /\bI am watching\b/g, replacements: ['I already watched', 'I want to watch', 'She is watching'], tag: 'tense' },
  { pattern: /\bI am eating\b/g, replacements: ['I already ate', 'I want to eat', 'He is eating'], tag: 'tense' },
  { pattern: /\bIt snowed\b/g, replacements: ['It will snow', 'It did not snow', 'It rained'], tag: 'tense' },
  { pattern: /\bIt is raining\b/g, replacements: ['It rained yesterday', 'It is snowing', 'It is not raining'], tag: 'tense' },

  // Pronouns & Subject-verb agreement
  { pattern: /\bI am\b/g, replacements: ['I am not', 'He is', 'She is', 'You are'], tag: 'pronoun' },
  { pattern: /\bHe is\b/g, replacements: ['He is not', 'She is', 'I am', 'You are'], tag: 'pronoun' },
  { pattern: /\bShe is\b/g, replacements: ['She is not', 'He is', 'I am', 'You are'], tag: 'pronoun' },
  { pattern: /\bWe are\b/g, replacements: ['We are not', 'They are', 'You are'], tag: 'pronoun' },
  { pattern: /\bThey are\b/g, replacements: ['They are not', 'We are', 'You are'], tag: 'pronoun' },
  { pattern: /\bAre you\b/g, replacements: ['Is he', 'Is she', 'Are they'], tag: 'pronoun' },
  { pattern: /\bDo you\b/g, replacements: ['Does he', 'Does she', 'Do they'], tag: 'pronoun' },
  { pattern: /\bCan you\b/g, replacements: ['Can he', 'Can she', 'Will you'], tag: 'pronoun' },
  { pattern: /\bWhere are you\b/g, replacements: ['Where is he', 'Where are they', 'When are you'], tag: 'pronoun' },
  { pattern: /\bMy name is\b/g, replacements: ['His name is', 'Her name is', 'My friend is'], tag: 'pronoun' },
  { pattern: /\bWhat is your\b/g, replacements: ['What is his', 'What is her', 'Where is your'], tag: 'pronoun' },
  { pattern: /\bI will\b/g, replacements: ['I will not', 'He will', 'We will'], tag: 'pronoun' },
  { pattern: /\bShe will\b/g, replacements: ['She will not', 'He will', 'I will'], tag: 'pronoun' },
  { pattern: /\bHe will\b/g, replacements: ['He will not', 'She will', 'I will'], tag: 'pronoun' },
  { pattern: /\bI work\b/g, replacements: ['I do not work', 'He works', 'We work'], tag: 'pronoun' },
  { pattern: /\bI study\b/g, replacements: ['I do not study', 'He studies', 'We study'], tag: 'pronoun' },
  { pattern: /\bI live\b/g, replacements: ['I do not live', 'He lives', 'They live'], tag: 'pronoun' },
  { pattern: /\bI go\b/g, replacements: ['I do not go', 'He goes', 'We go'], tag: 'pronoun' },
  { pattern: /\bShe works\b/g, replacements: ['She does not work', 'He works', 'My mom works'], tag: 'pronoun' },
  { pattern: /\bHe works\b/g, replacements: ['He does not work', 'She works', 'My dad works'], tag: 'pronoun' },
  { pattern: /\bShe goes\b/g, replacements: ['She does not go', 'He goes', 'They go'], tag: 'pronoun' },
  { pattern: /\bHe goes\b/g, replacements: ['He does not go', 'She goes', 'They go'], tag: 'pronoun' },
  { pattern: /\bI get off work\b/g, replacements: ['I go to work', 'He gets off work', 'We get off work'], tag: 'verb' },
  { pattern: /\bPlease give me\b/g, replacements: ['Please give him', 'Please give her', 'Please bring us'], tag: 'pronoun' },
  { pattern: /\bThis\b/g, replacements: ['That'], tag: 'demonstrative' },
  { pattern: /\bThat\b/g, replacements: ['This'], tag: 'demonstrative' },
  { pattern: /\bthis\b/g, replacements: ['that'], tag: 'demonstrative' },
  { pattern: /\bthat\b/g, replacements: ['this'], tag: 'demonstrative' },
  { pattern: /\bmy\b/g, replacements: ['your', 'his', 'her'], tag: 'pronoun' },
  { pattern: /\bMy\b/g, replacements: ['Your', 'His', 'Her'], tag: 'pronoun' },
  { pattern: /\byour\b/g, replacements: ['his', 'her', 'my', 'their'], tag: 'pronoun' },
  { pattern: /\bYour\b/g, replacements: ['His', 'Her', 'My'], tag: 'pronoun' },
  { pattern: /\bhis\b/g, replacements: ['her', 'my', 'your'], tag: 'pronoun' },
  { pattern: /\bHis\b/g, replacements: ['Her', 'My', 'Your'], tag: 'pronoun' },
  { pattern: /\bher\b/g, replacements: ['his', 'my', 'your'], tag: 'pronoun' },
  { pattern: /\bHer\b/g, replacements: ['His', 'My', 'Your'], tag: 'pronoun' },
  { pattern: /\bour\b/g, replacements: ['their', 'your', 'my'], tag: 'pronoun' },
  { pattern: /\bOur\b/g, replacements: ['Their', 'Your', 'My'], tag: 'pronoun' },
  { pattern: /\bwe\b/g, replacements: ['they', 'you all'], tag: 'pronoun' },
  { pattern: /\bWe\b/g, replacements: ['They', 'You all'], tag: 'pronoun' },
  { pattern: /\bShe\b/g, replacements: ['He'], tag: 'pronoun' },
  { pattern: /\bHe\b/g, replacements: ['She'], tag: 'pronoun' },

  // Question-word traps
  { pattern: /\bWhat time\b/g, replacements: ['Which day', 'Where'], tag: 'question' },
  { pattern: /\bHow much\b/g, replacements: ['How many', 'Which one'], tag: 'question' },
  { pattern: /\bHow many\b/g, replacements: ['How much', 'Which'], tag: 'question' },
  { pattern: /\bWhich country\b/g, replacements: ['Which city', 'What language'], tag: 'question' },
  { pattern: /\bWhat is\b/g, replacements: ['Where is', 'Whose is'], tag: 'question' },
  { pattern: /\bWho is\b/g, replacements: ['Where is', 'How is'], tag: 'question' },
  { pattern: /\bWhere is\b/g, replacements: ['Who is', 'How is'], tag: 'question' },

  // Time words, days & schedules
  { pattern: /\btoday\b/g, replacements: ['tomorrow', 'yesterday'], tag: 'time' },
  { pattern: /\bToday\b/g, replacements: ['Tomorrow', 'Yesterday'], tag: 'time' },
  { pattern: /\btomorrow\b/g, replacements: ['today', 'yesterday'], tag: 'time' },
  { pattern: /\bTomorrow\b/g, replacements: ['Today', 'Yesterday'], tag: 'time' },
  { pattern: /\byesterday\b/g, replacements: ['today', 'tomorrow'], tag: 'time' },
  { pattern: /\bYesterday\b/g, replacements: ['Today', 'Tomorrow'], tag: 'time' },
  { pattern: /\bthis year\b/g, replacements: ['last year', 'next year'], tag: 'time' },
  { pattern: /\bThis year\b/g, replacements: ['Last year', 'Next year'], tag: 'time' },
  { pattern: /\blast year\b/g, replacements: ['this year', 'next year'], tag: 'time' },
  { pattern: /\bLast year\b/g, replacements: ['This year', 'Next year'], tag: 'time' },
  { pattern: /\bnext year\b/g, replacements: ['this year', 'last year'], tag: 'time' },
  { pattern: /\bNext year\b/g, replacements: ['This year', 'Last year'], tag: 'time' },
  { pattern: /\bthis week\b/g, replacements: ['next week', 'last week'], tag: 'time' },
  { pattern: /\bnext week\b/g, replacements: ['this week', 'last week'], tag: 'time' },
  { pattern: /\bmorning\b/g, replacements: ['afternoon', 'evening'], tag: 'time' },
  { pattern: /\bafternoon\b/g, replacements: ['morning', 'evening'], tag: 'time' },
  { pattern: /\bevening\b/g, replacements: ['morning', 'afternoon'], tag: 'time' },
  { pattern: /\bnoon\b/g, replacements: ['evening', 'morning'], tag: 'time' },
  { pattern: /\bSunday\b/g, replacements: ['Saturday', 'Monday'], tag: 'time' },
  { pattern: /\bSaturday\b/g, replacements: ['Sunday', 'Friday'], tag: 'time' },
  { pattern: /\bMonday\b/g, replacements: ['Tuesday', 'Sunday'], tag: 'time' },
  { pattern: /\bFriday\b/g, replacements: ['Thursday', 'Saturday'], tag: 'time' },
  { pattern: /\btonight\b/g, replacements: ['tomorrow evening', 'this afternoon'], tag: 'time' },
  { pattern: /\bnow\b/g, replacements: ['tomorrow', 'earlier'], tag: 'time' },
  { pattern: /\b6:30\b/g, replacements: ['7:30', '5:30'], tag: 'time' },
  { pattern: /\b2:00 PM\b/g, replacements: ['3:00 PM', '4:00 PM'], tag: 'time' },
  { pattern: /\b3:00 PM\b/g, replacements: ['2:00 PM', '5:00 PM'], tag: 'time' },
  { pattern: /\b7:00 PM\b/g, replacements: ['8:00 PM', '6:00 PM'], tag: 'time' },
  { pattern: /\b8:00 AM\b/g, replacements: ['9:00 AM', '7:00 AM'], tag: 'time' },
  { pattern: /\b8:40\b/g, replacements: ['8:20', '9:40'], tag: 'time' },
  { pattern: /\b10:10\b/g, replacements: ['10:30', '9:10'], tag: 'time' },
  { pattern: /\bSeptember 8th\b/g, replacements: ['August 9th', 'September 7th'], tag: 'time' },
  { pattern: /\bSeptember 7th\b/g, replacements: ['July 9th', 'September 8th'], tag: 'time' },
  { pattern: /\bMarch 1st\b/g, replacements: ['March 10th', 'January 3rd'], tag: 'time' },
  { pattern: /\bMarch 6\b/g, replacements: ['June 3', 'March 8'], tag: 'time' },
  { pattern: /\bsee you tomorrow\b/g, replacements: ['see you this afternoon', 'see you next week'], tag: 'time' },
  { pattern: /\bSee you tomorrow\b/g, replacements: ['See you this afternoon', 'See you next week'], tag: 'time' },

  // Numbers, measure units & quantities
  { pattern: /\btwo\b/g, replacements: ['three', 'four'], tag: 'quantity' },
  { pattern: /\bthree\b/g, replacements: ['two', 'five'], tag: 'quantity' },
  { pattern: /\bfour\b/g, replacements: ['three', 'five'], tag: 'quantity' },
  { pattern: /\bfive\b/g, replacements: ['four', 'six'], tag: 'quantity' },
  { pattern: /\bsix\b/g, replacements: ['seven', 'eight'], tag: 'quantity' },
  { pattern: /\bseven\b/g, replacements: ['six', 'eight'], tag: 'quantity' },
  { pattern: /\beight\b/g, replacements: ['seven', 'nine'], tag: 'quantity' },
  { pattern: /\bnine\b/g, replacements: ['eight', 'ten'], tag: 'quantity' },
  { pattern: /\bten\b/g, replacements: ['twenty', 'eight'], tag: 'quantity' },
  { pattern: /\btwenty\b/g, replacements: ['twelve', 'thirty'], tag: 'quantity' },
  { pattern: /\ba cup of\b/g, replacements: ['two cups of', 'a pot of'], tag: 'measure' },
  { pattern: /\ba glass of\b/g, replacements: ['two glasses of', 'a bottle of'], tag: 'measure' },
  { pattern: /\bhalf a day\b/g, replacements: ['two days', 'a full day'], tag: 'quantity' },
  { pattern: /\bsecond\b/g, replacements: ['first', 'third'], tag: 'quantity' },

  // Family & people roles
  { pattern: /\bolder brother\b/g, replacements: ['younger brother', 'older sister'], tag: 'person' },
  { pattern: /\byounger brother\b/g, replacements: ['older brother', 'younger sister'], tag: 'person' },
  { pattern: /\bolder sister\b/g, replacements: ['younger sister', 'older brother'], tag: 'person' },
  { pattern: /\byounger sister\b/g, replacements: ['older sister', 'younger brother'], tag: 'person' },
  { pattern: /\bson\b/g, replacements: ['daughter', 'younger brother'], tag: 'person' },
  { pattern: /\bdaughter\b/g, replacements: ['son', 'younger sister'], tag: 'person' },
  { pattern: /\bdad\b/g, replacements: ['mom', 'older brother'], tag: 'person' },
  { pattern: /\bmom\b/g, replacements: ['dad', 'older sister'], tag: 'person' },
  { pattern: /\bMom\b/g, replacements: ['Dad', 'Older sister'], tag: 'person' },
  { pattern: /\bDad\b/g, replacements: ['Mom', 'Older brother'], tag: 'person' },
  { pattern: /\bgirlfriend\b/g, replacements: ['boyfriend', 'classmate'], tag: 'person' },
  { pattern: /\bboyfriend\b/g, replacements: ['girlfriend', 'friend'], tag: 'person' },
  { pattern: /\bTeacher Wang\b/g, replacements: ['Teacher Li', 'Teacher Chen'], tag: 'person' },
  { pattern: /\bTeacher Li\b/g, replacements: ['Teacher Wang', 'Teacher Zhang'], tag: 'person' },
  { pattern: /\bclassmate\b/g, replacements: ['friend', 'teacher'], tag: 'person' },
  { pattern: /\bstudent\b/g, replacements: ['teacher', 'doctor'], tag: 'person' },
  { pattern: /\bteacher\b/g, replacements: ['student', 'classmate'], tag: 'person' },
  { pattern: /\bdoctor\b/g, replacements: ['teacher', 'patient'], tag: 'person' },
  { pattern: /\bfriend\b/g, replacements: ['classmate', 'older brother'], tag: 'person' },
  { pattern: /\beveryone\b/g, replacements: ['classmates', 'teachers'], tag: 'person' },

  // Places & countries
  { pattern: /\bChinese\b/g, replacements: ['French', 'Thai'], tag: 'place' },
  { pattern: /\bChina\b/g, replacements: ['France', 'Thailand'], tag: 'place' },
  { pattern: /\bFrance\b/g, replacements: ['China', 'Thailand'], tag: 'place' },
  { pattern: /\bFrench\b/g, replacements: ['Chinese', 'Thai'], tag: 'place' },
  { pattern: /\bThailand\b/g, replacements: ['China', 'France'], tag: 'place' },
  { pattern: /\bThai\b/g, replacements: ['Chinese', 'French'], tag: 'place' },
  { pattern: /\bBeijing\b/g, replacements: ["Xi'an", 'Shanghai'], tag: 'place' },
  { pattern: /\bXi'an\b/g, replacements: ['Beijing', 'Shanghai'], tag: 'place' },
  { pattern: /\bmiddle school\b/g, replacements: ['elementary school', 'university'], tag: 'place' },
  { pattern: /\belementary school\b/g, replacements: ['middle school', 'university'], tag: 'place' },
  { pattern: /\buniversity\b/g, replacements: ['middle school', 'elementary school'], tag: 'place' },
  { pattern: /\bschool\b/g, replacements: ['hospital', 'bookstore'], tag: 'place' },
  { pattern: /\bhospital\b/g, replacements: ['school', 'company'], tag: 'place' },
  { pattern: /\bsupermarket\b/g, replacements: ['bookstore', 'restaurant'], tag: 'place' },
  { pattern: /\bbookstore\b/g, replacements: ['supermarket', 'cinema'], tag: 'place' },
  { pattern: /\bcinema\b/g, replacements: ['restaurant', 'supermarket'], tag: 'place' },
  { pattern: /\brestaurant\b/g, replacements: ['supermarket', 'school'], tag: 'place' },
  { pattern: /\bcompany\b/g, replacements: ['hospital', 'school'], tag: 'place' },
  { pattern: /\bairport\b/g, replacements: ['train station', 'hotel'], tag: 'place' },
  { pattern: /\bhome\b/g, replacements: ['school', 'the office'], tag: 'place' },

  // Confusable HSK 1 verb & semantic-field traps
  { pattern: /\bhave a day off\b/g, replacements: ['go to work', 'have class'], tag: 'verb' },
  { pattern: /\boff work\b/g, replacements: ['at work', 'in class'], tag: 'verb' },
  { pattern: /\bin class\b/g, replacements: ['off work', 'at home'], tag: 'verb' },
  { pattern: /\bwatch a movie\b/g, replacements: ['read a book', 'go shopping'], tag: 'verb' },
  { pattern: /\bwatched a movie\b/g, replacements: ['bought a movie ticket', 'read a book'], tag: 'verb' },
  { pattern: /\blearn how to cook\b/g, replacements: ['teach how to cook', 'learn how to speak Chinese', 'buy some cooked'], tag: 'verb' },
  { pattern: /\bcook dishes\b/g, replacements: ['eat dishes', 'buy fruit', 'make tea'], tag: 'verb' },
  { pattern: /\blearn\b/g, replacements: ['teach', 'practice'], tag: 'verb' },
  { pattern: /\bcook\b/g, replacements: ['eat', 'buy'], tag: 'verb' },
  { pattern: /\bdrink\b/g, replacements: ['buy', 'make'], tag: 'verb' },
  { pattern: /\beat\b/g, replacements: ['cook', 'buy'], tag: 'verb' },
  { pattern: /\bbuy\b/g, replacements: ['sell', 'look at'], tag: 'verb' },
  { pattern: /\bstudy\b/g, replacements: ['teach', 'work'], tag: 'verb' },
  { pattern: /\bwork\b/g, replacements: ['study', 'rest'], tag: 'verb' },
  { pattern: /\bsnowed\b/g, replacements: ['rained', 'was windy'], tag: 'verb' },
  { pattern: /\braining\b/g, replacements: ['snowing', 'sunny'], tag: 'verb' },
  { pattern: /\bpiece of clothing\b/g, replacements: ['pair of shoes', 'cup of tea', 'Chinese book'], tag: 'noun' },
  { pattern: /\bclothes\b/g, replacements: ['shoes', 'books', 'fruit'], tag: 'noun' },
  { pattern: /\bdishes\b/g, replacements: ['noodles', 'dumplings', 'fruit'], tag: 'noun' },
  { pattern: /\bphone number\b/g, replacements: ['room number', 'home address'], tag: 'noun' },
  { pattern: /\bcat\b/g, replacements: ['dog', 'bird'], tag: 'noun' },
  { pattern: /\bdog\b/g, replacements: ['cat', 'rabbit'], tag: 'noun' },
  { pattern: /\btea\b/g, replacements: ['milk', 'hot water'], tag: 'noun' },
  { pattern: /\bmilk\b/g, replacements: ['tea', 'water'], tag: 'noun' },
  { pattern: /\bwater\b/g, replacements: ['tea', 'milk'], tag: 'noun' },
  { pattern: /\bnoodles\b/g, replacements: ['dumplings', 'cooked rice'], tag: 'noun' },
  { pattern: /\bdumplings\b/g, replacements: ['noodles', 'steamed buns'], tag: 'noun' },
  { pattern: /\bsteamed buns\b/g, replacements: ['dumplings', 'cooked rice'], tag: 'noun' },
  { pattern: /\brice\b/g, replacements: ['noodles', 'steamed buns'], tag: 'noun' },
  { pattern: /\bapples\b/g, replacements: ['fruit', 'pears'], tag: 'noun' },
  { pattern: /\bapple\b/g, replacements: ['cup', 'book'], tag: 'noun' },
  { pattern: /\btaxi\b/g, replacements: ['train', 'bus'], tag: 'noun' },
  { pattern: /\btrain\b/g, replacements: ['airplane', 'taxi'], tag: 'noun' },
  { pattern: /\bairplane\b/g, replacements: ['train', 'taxi'], tag: 'noun' },
  { pattern: /\bnew\b/g, replacements: ['old', 'expensive'], tag: 'adjective' },
  { pattern: /\bold\b/g, replacements: ['new', 'small'], tag: 'adjective' },
  { pattern: /\bbig\b/g, replacements: ['small', 'new'], tag: 'adjective' },
  { pattern: /\bsmall\b/g, replacements: ['big', 'old'], tag: 'adjective' },
  { pattern: /\bcheap\b/g, replacements: ['expensive', 'small'], tag: 'adjective' },
  { pattern: /\bexpensive\b/g, replacements: ['cheap', 'nice'], tag: 'adjective' },
  { pattern: /\bcold\b/g, replacements: ['hot', 'warm'], tag: 'adjective' },
  { pattern: /\bhot\b/g, replacements: ['cold', 'cool'], tag: 'adjective' },
  { pattern: /\bin front of\b/g, replacements: ['behind', 'inside'], tag: 'position' },
  { pattern: /\bbehind\b/g, replacements: ['in front of', 'next to'], tag: 'position' },
  { pattern: /\bon the table\b/g, replacements: ['under the table', 'on the chair'], tag: 'position' },
  { pattern: /\bunder the table\b/g, replacements: ['on the table', 'outside the room'], tag: 'position' },
  { pattern: /\bon the chair\b/g, replacements: ['under the chair', 'on the table'], tag: 'position' },
  { pattern: /\boutside\b/g, replacements: ['inside', 'in front of'], tag: 'position' },

  // Greeting & politeness formulas (matched in tone & length)
  { pattern: /\bNice to meet you\b/g, replacements: ['See you tomorrow', 'Thank you very much', 'Welcome to our school'], tag: 'greeting' },
  { pattern: /\bThank you\b/g, replacements: ["You're welcome", 'Excuse me', 'I am sorry'], tag: 'greeting' },
  { pattern: /\bYou're welcome\b/g, replacements: ['Thank you very much', 'It does not matter', 'See you later'], tag: 'greeting' },
  { pattern: /\bI'm sorry\b/g, replacements: ["It's all right", 'Thank you', 'Excuse me'], tag: 'greeting' },
  { pattern: /\bHello\b/g, replacements: ['Goodbye', 'Good morning', 'Thank you'], tag: 'greeting' },
  { pattern: /\bGoodbye\b/g, replacements: ['Hello', 'Thank you', 'See you soon'], tag: 'greeting' },
];

export const CHINESE_SWAP_RULES: SwapRule[] = [
  // Negation / polarity & aspect traps (multi-char before single-char)
  { pattern: /不是/g, replacements: ['是', '也是'], tag: 'polarity' },
  { pattern: /没有/g, replacements: ['有', '也有'], tag: 'polarity' },
  { pattern: /不想/g, replacements: ['想', '很想'], tag: 'polarity' },
  { pattern: /不能/g, replacements: ['能', '可以'], tag: 'polarity' },
  { pattern: /不会/g, replacements: ['会', '想'], tag: 'polarity' },
  { pattern: /不喜欢/g, replacements: ['喜欢', '很喜欢'], tag: 'polarity' },
  { pattern: /不忙/g, replacements: ['很忙', '太忙'], tag: 'polarity' },
  { pattern: /不贵/g, replacements: ['很贵', '太贵'], tag: 'polarity' },
  { pattern: /不冷/g, replacements: ['很冷', '太冷'], tag: 'polarity' },
  { pattern: /不热/g, replacements: ['很热', '太热'], tag: 'polarity' },
  { pattern: /很好/g, replacements: ['不太好', '不好'], tag: 'polarity' },
  { pattern: /很忙/g, replacements: ['不忙', '不太忙'], tag: 'polarity' },
  { pattern: /很贵/g, replacements: ['不贵', '很便宜'], tag: 'polarity' },
  { pattern: /真便宜/g, replacements: ['真贵', '不太便宜'], tag: 'polarity' },
  { pattern: /很好吃/g, replacements: ['不太好吃', '不好吃'], tag: 'polarity' },
  { pattern: /很高兴/g, replacements: ['不太高兴', '不高兴'], tag: 'polarity' },
  { pattern: /去了/g, replacements: ['没去', '要去'], tag: 'tense' },
  { pattern: /看了/g, replacements: ['没看', '要看'], tag: 'tense' },
  { pattern: /买了/g, replacements: ['没买', '想买'], tag: 'tense' },
  { pattern: /吃了/g, replacements: ['没吃', '想吃'], tag: 'tense' },
  { pattern: /喝了/g, replacements: ['没喝', '想喝'], tag: 'tense' },
  { pattern: /下雪了/g, replacements: ['下雨了', '没下雪', '要下雪'], tag: 'tense' },
  { pattern: /下雨了/g, replacements: ['下雪了', '没下雨', '要下雨'], tag: 'tense' },
  { pattern: /正在/g, replacements: ['明天要', '昨天'], tag: 'tense' },
  { pattern: /是/g, replacements: ['不是'], tag: 'polarity' },
  { pattern: /有/g, replacements: ['没有'], tag: 'polarity' },

  // Pronouns
  { pattern: /我们/g, replacements: ['他们', '你们'], tag: 'pronoun' },
  { pattern: /你们/g, replacements: ['我们', '他们'], tag: 'pronoun' },
  { pattern: /他们/g, replacements: ['我们', '你们'], tag: 'pronoun' },
  { pattern: /我/g, replacements: ['他', '她', '你'], tag: 'pronoun' },
  { pattern: /你/g, replacements: ['他', '她', '我'], tag: 'pronoun' },
  { pattern: /您/g, replacements: ['他', '她'], tag: 'pronoun' },
  { pattern: /他/g, replacements: ['她', '我', '你'], tag: 'pronoun' },
  { pattern: /她/g, replacements: ['他', '我', '你'], tag: 'pronoun' },

  // Question words
  { pattern: /什么时候/g, replacements: ['在什么地方', '几点'], tag: 'question' },
  { pattern: /多少钱/g, replacements: ['多少个', '怎么样'], tag: 'question' },
  { pattern: /多少/g, replacements: ['几个', '什么'], tag: 'question' },
  { pattern: /什么/g, replacements: ['哪', '谁'], tag: 'question' },
  { pattern: /哪儿/g, replacements: ['什么时候', '谁'], tag: 'question' },
  { pattern: /几点/g, replacements: ['星期几', '哪天'], tag: 'question' },
  { pattern: /几岁/g, replacements: ['几个', '哪年'], tag: 'question' },

  // Time words
  { pattern: /今天/g, replacements: ['明天', '昨天'], tag: 'time' },
  { pattern: /明天/g, replacements: ['今天', '昨天'], tag: 'time' },
  { pattern: /昨天/g, replacements: ['今天', '明天'], tag: 'time' },
  { pattern: /今年/g, replacements: ['去年', '明年'], tag: 'time' },
  { pattern: /去年/g, replacements: ['今年', '明年'], tag: 'time' },
  { pattern: /明年/g, replacements: ['今年', '去年'], tag: 'time' },
  { pattern: /上午/g, replacements: ['下午', '晚上'], tag: 'time' },
  { pattern: /下午/g, replacements: ['上午', '晚上'], tag: 'time' },
  { pattern: /晚上/g, replacements: ['上午', '下午'], tag: 'time' },
  { pattern: /早上/g, replacements: ['晚上', '下午'], tag: 'time' },
  { pattern: /中午/g, replacements: ['晚上', '上午'], tag: 'time' },
  { pattern: /星期天/g, replacements: ['星期六', '星期一'], tag: 'time' },
  { pattern: /星期日/g, replacements: ['星期六', '星期一'], tag: 'time' },
  { pattern: /星期六/g, replacements: ['星期天', '星期五'], tag: 'time' },

  // Measure words & numbers
  { pattern: /一杯/g, replacements: ['两杯', '一个'], tag: 'measure' },
  { pattern: /一件/g, replacements: ['两件', '一个'], tag: 'measure' },
  { pattern: /一本/g, replacements: ['两本', '一个'], tag: 'measure' },
  { pattern: /一只/g, replacements: ['两只', '一个'], tag: 'measure' },
  { pattern: /两斤/g, replacements: ['三斤', '一斤'], tag: 'measure' },
  { pattern: /四口/g, replacements: ['三口', '五口'], tag: 'measure' },
  { pattern: /两个/g, replacements: ['三个', '四个'], tag: 'quantity' },
  { pattern: /一个/g, replacements: ['两个', '三个'], tag: 'quantity' },
  { pattern: /两/g, replacements: ['三', '四'], tag: 'quantity' },
  { pattern: /三/g, replacements: ['两', '五'], tag: 'quantity' },
  { pattern: /四/g, replacements: ['三', '五'], tag: 'quantity' },
  { pattern: /五/g, replacements: ['四', '六'], tag: 'quantity' },
  { pattern: /六/g, replacements: ['七', '八'], tag: 'quantity' },
  { pattern: /七/g, replacements: ['六', '八'], tag: 'quantity' },
  { pattern: /八/g, replacements: ['七', '九'], tag: 'quantity' },
  { pattern: /九/g, replacements: ['八', '十'], tag: 'quantity' },
  { pattern: /十/g, replacements: ['八', '九'], tag: 'quantity' },

  // Family & people
  { pattern: /哥哥/g, replacements: ['弟弟', '姐姐'], tag: 'person' },
  { pattern: /弟弟/g, replacements: ['哥哥', '妹妹'], tag: 'person' },
  { pattern: /姐姐/g, replacements: ['妹妹', '哥哥'], tag: 'person' },
  { pattern: /妹妹/g, replacements: ['姐姐', '弟弟'], tag: 'person' },
  { pattern: /儿子/g, replacements: ['女儿', '弟弟'], tag: 'person' },
  { pattern: /女儿/g, replacements: ['儿子', '妹妹'], tag: 'person' },
  { pattern: /爸爸/g, replacements: ['妈妈', '哥哥'], tag: 'person' },
  { pattern: /妈妈/g, replacements: ['爸爸', '姐姐'], tag: 'person' },
  { pattern: /王老师/g, replacements: ['李老师', '陈老师'], tag: 'person' },
  { pattern: /李老师/g, replacements: ['王老师', '张老师'], tag: 'person' },
  { pattern: /男朋友/g, replacements: ['女朋友', '同学'], tag: 'person' },
  { pattern: /女朋友/g, replacements: ['男朋友', '同学'], tag: 'person' },
  { pattern: /同学/g, replacements: ['朋友', '老师'], tag: 'person' },
  { pattern: /老师/g, replacements: ['学生', '医生'], tag: 'person' },
  { pattern: /学生/g, replacements: ['老师', '同学'], tag: 'person' },
  { pattern: /医生/g, replacements: ['老师', '学生'], tag: 'person' },

  // Places & countries
  { pattern: /中国/g, replacements: ['法国', '泰国'], tag: 'place' },
  { pattern: /法国/g, replacements: ['中国', '泰国'], tag: 'place' },
  { pattern: /泰国/g, replacements: ['中国', '法国'], tag: 'place' },
  { pattern: /北京/g, replacements: ['西安', '上海'], tag: 'place' },
  { pattern: /西安/g, replacements: ['北京', '上海'], tag: 'place' },
  { pattern: /中学/g, replacements: ['小学', '大学'], tag: 'place' },
  { pattern: /小学/g, replacements: ['中学', '大学'], tag: 'place' },
  { pattern: /大学/g, replacements: ['中学', '小学'], tag: 'place' },
  { pattern: /学校/g, replacements: ['医院', '书店'], tag: 'place' },
  { pattern: /医院/g, replacements: ['学校', '公司'], tag: 'place' },
  { pattern: /超市/g, replacements: ['书店', '商店'], tag: 'place' },
  { pattern: /书店/g, replacements: ['超市', '电影院'], tag: 'place' },
  { pattern: /电影院/g, replacements: ['饭店', '超市'], tag: 'place' },
  { pattern: /饭店/g, replacements: ['超市', '学校'], tag: 'place' },
  { pattern: /公司/g, replacements: ['医院', '学校'], tag: 'place' },
  { pattern: /机场/g, replacements: ['火车站', '饭店'], tag: 'place' },

  // Verbs, adjectives, positions & nouns
  { pattern: /下班/g, replacements: ['上班', '下课'], tag: 'verb' },
  { pattern: /上班/g, replacements: ['下班', '上课'], tag: 'verb' },
  { pattern: /上课/g, replacements: ['下课', '上班'], tag: 'verb' },
  { pattern: /下课/g, replacements: ['上课', '下班'], tag: 'verb' },
  { pattern: /休息/g, replacements: ['工作', '学习'], tag: 'verb' },
  { pattern: /工作/g, replacements: ['学习', '休息'], tag: 'verb' },
  { pattern: /学习/g, replacements: ['工作', '休息'], tag: 'verb' },
  { pattern: /做饭/g, replacements: ['吃饭', '买菜'], tag: 'verb' },
  { pattern: /吃饭/g, replacements: ['做饭', '喝茶'], tag: 'verb' },
  { pattern: /看电影/g, replacements: ['看书', '买东西'], tag: 'verb' },
  { pattern: /认识/g, replacements: ['知道', '喜欢'], tag: 'verb' },
  { pattern: /便宜/g, replacements: ['贵', '好吃'], tag: 'adjective' },
  { pattern: /很冷/g, replacements: ['很热', '不冷'], tag: 'adjective' },
  { pattern: /很热/g, replacements: ['很冷', '不热'], tag: 'adjective' },
  { pattern: /太冷/g, replacements: ['太热', '不冷'], tag: 'adjective' },
  { pattern: /太热/g, replacements: ['太冷', '不热'], tag: 'adjective' },
  { pattern: /下雪/g, replacements: ['下雨'], tag: 'verb' },
  { pattern: /下雨/g, replacements: ['下雪'], tag: 'verb' },
  { pattern: /前边/g, replacements: ['后边', '里边'], tag: 'position' },
  { pattern: /后边/g, replacements: ['前边', '外边'], tag: 'position' },
  { pattern: /桌子上/g, replacements: ['桌子下', '椅子上'], tag: 'position' },
  { pattern: /桌子下/g, replacements: ['桌子上', '椅子下'], tag: 'position' },
  { pattern: /椅子上/g, replacements: ['椅子下', '桌子上'], tag: 'position' },
  { pattern: /小猫/g, replacements: ['小狗', '小鸟'], tag: 'noun' },
  { pattern: /小狗/g, replacements: ['小猫', '小鱼'], tag: 'noun' },
  { pattern: /面条儿/g, replacements: ['饺子', '米饭'], tag: 'noun' },
  { pattern: /饺子/g, replacements: ['面条儿', '包子'], tag: 'noun' },
  { pattern: /包子/g, replacements: ['饺子', '米饭'], tag: 'noun' },
  { pattern: /米饭/g, replacements: ['面条儿', '包子'], tag: 'noun' },
  { pattern: /牛奶/g, replacements: ['茶', '热水'], tag: 'noun' },
  { pattern: /茶/g, replacements: ['牛奶', '水'], tag: 'noun' },
  { pattern: /出租车/g, replacements: ['火车', '飞机'], tag: 'noun' },
  { pattern: /火车/g, replacements: ['飞机', '出租车'], tag: 'noun' },
  { pattern: /飞机/g, replacements: ['火车', '出租车'], tag: 'noun' },
  { pattern: /手机号/g, replacements: ['房间号', '电话'], tag: 'noun' },
  { pattern: /你好/g, replacements: ['再见', '谢谢', '您好'], tag: 'greeting' },
  { pattern: /再见/g, replacements: ['你好', '明天见', '谢谢'], tag: 'greeting' },
  { pattern: /谢谢/g, replacements: ['不客气', '对不起', '再见'], tag: 'greeting' },
  { pattern: /不客气/g, replacements: ['没关系', '谢谢你', '对不起'], tag: 'greeting' },
  { pattern: /对不起/g, replacements: ['没关系', '不客气', '请问'], tag: 'greeting' },
];

const NO_SELF_DUP_TAGS = new Set([
  'noun',
  'place',
  'person',
  'time',
  'adjective',
  'verb',
  'position',
  'quantity',
]);

function isDuplicateInjection(source: string, rep: string, tag: string): boolean {
  if (!NO_SELF_DUP_TAGS.has(tag)) return false;
  const trimmed = rep.trim();
  if (trimmed.length === 0) return false;
  // Prevent creating unnatural doubled items like "饺子、饺子" or "noodles and noodles"
  if (/[\u4e00-\u9fff]/.test(trimmed)) {
    return source.includes(trimmed);
  }
  const escaped = trimmed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`\\b${escaped}\\b`, 'i').test(source);
}

/**
 * Generates up to `maxVariants` subtle minimal-pair variants of `text` using `rules`.
 * Prioritizes 1 variant per distinct trap category (polarity, tense/time, pronoun, verb, etc.)
 * before adding extra variants or orthogonal double-mutations.
 */
export function generateMutatedVariants(
  text: string,
  rules: SwapRule[],
  maxVariants: number,
  rng: () => number = Math.random
): {
  variants: string[];
  tagsUsed: string[];
} {
  const unique = new Set<string>([text]);
  const variants: string[] = [];
  const tagsUsed = new Set<string>();

  // Match rules that trigger on `text`
  const matchingRules = rules.filter((r) => {
    r.pattern.lastIndex = 0;
    return r.pattern.test(text);
  });

  // Pass 1: Prioritize diverse semantic trap categories so the 3 distractors test 3 distinct traps
  const usedTagsInPass1 = new Set<string>();
  const orderedRules = shuffleWithRng(matchingRules, rng);

  for (const rule of orderedRules) {
    if (variants.length >= maxVariants) break;
    if (usedTagsInPass1.has(rule.tag)) continue;

    for (const rep of shuffleWithRng(rule.replacements, rng)) {
      if (isDuplicateInjection(text, rep, rule.tag)) continue;
      rule.pattern.lastIndex = 0;
      const mutated = text.replace(rule.pattern, rep);
      if (mutated !== text && !unique.has(mutated)) {
        unique.add(mutated);
        variants.push(mutated);
        tagsUsed.add(rule.tag);
        usedTagsInPass1.add(rule.tag);
        break;
      }
    }
  }

  // Pass 2: Additional single swaps from remaining replacements
  for (const rule of orderedRules) {
    if (variants.length >= maxVariants) break;
    for (const rep of shuffleWithRng(rule.replacements, rng)) {
      if (variants.length >= maxVariants) break;
      if (isDuplicateInjection(text, rep, rule.tag)) continue;
      rule.pattern.lastIndex = 0;
      const mutated = text.replace(rule.pattern, rep);
      if (mutated !== text && !unique.has(mutated)) {
        unique.add(mutated);
        variants.push(mutated);
        tagsUsed.add(rule.tag);
      }
    }
  }

  // Pass 3: Combine two orthogonal mutations if needed to reach `maxVariants`
  if (variants.length < maxVariants && variants.length > 0 && orderedRules.length >= 2) {
    for (const base of [...variants]) {
      if (variants.length >= maxVariants) break;
      for (const rule of orderedRules) {
        if (variants.length >= maxVariants) break;
        for (const rep of rule.replacements) {
          if (variants.length >= maxVariants) break;
          if (isDuplicateInjection(base, rep, rule.tag)) continue;
          rule.pattern.lastIndex = 0;
          const mutated = base.replace(rule.pattern, rep);
          if (mutated !== text && !unique.has(mutated)) {
            unique.add(mutated);
            variants.push(mutated);
            tagsUsed.add(rule.tag);
          }
        }
      }
    }
  }

  return { variants: variants.slice(0, maxVariants), tagsUsed: Array.from(tagsUsed) };
}

function getTrailingPunctuationType(text: string): 'q' | 'ex' | 'stmt' {
  const trimmed = text.trim();
  if (trimmed.endsWith('?') || trimmed.endsWith('？')) return 'q';
  if (trimmed.endsWith('!') || trimmed.endsWith('！')) return 'ex';
  return 'stmt';
}

function tokenizeForSimilarity(text: string, isChinese: boolean): Set<string> {
  if (isChinese) {
    return new Set(Array.from(text.replace(/[\s，。？！、,.?!]/g, '')));
  }
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s']/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 1)
  );
}

/**
 * Ranks fallback candidates by structural & lexical closeness to `target` so
 * distractors always match length, punctuation, chapter topic, and shared vocabulary.
 */
function rankCloseFallbacks(
  target: TranslationCandidate,
  pool: TranslationCandidate[],
  direction: 'zh-to-en' | 'en-to-zh',
  rng: () => number
): string[] {
  const isChinese = direction === 'en-to-zh';
  const targetText = isChinese ? target.hanzi : target.arabic;
  const targetPunct = getTrailingPunctuationType(targetText);
  const targetLen = Math.max(1, targetText.length);
  const targetTokens = tokenizeForSimilarity(targetText, isChinese);

  const scored = pool
    .filter((other) => other.id !== target.id)
    .map((other) => {
      const candText = isChinese ? other.hanzi : other.arabic;
      if (candText === targetText) return null;

      let score = 0;
      // Same chapter topic bonus
      if (target.chapterId !== undefined && other.chapterId === target.chapterId) {
        score += 40;
      }
      // Same sentence mood / punctuation bonus
      if (getTrailingPunctuationType(candText) === targetPunct) {
        score += 30;
      }
      // Length closeness (0..30)
      const lenRatio = Math.min(targetLen, candText.length) / Math.max(targetLen, candText.length);
      score += Math.round(lenRatio * 30);

      // Lexical token overlap (0..25)
      const candTokens = tokenizeForSimilarity(candText, isChinese);
      if (targetTokens.size > 0 && candTokens.size > 0) {
        let overlap = 0;
        for (const t of targetTokens) {
          if (candTokens.has(t)) overlap++;
        }
        const jaccard = overlap / (targetTokens.size + candTokens.size - overlap);
        score += Math.round(jaccard * 25);
      }

      // Small deterministic jitter to avoid identical order on ties
      score += rng() * 4;
      return { text: candText, score };
    })
    .filter((x): x is { text: string; score: number } => x !== null);

  scored.sort((a, b) => b.score - a.score);
  return scored.map((s) => s.text);
}

/**
 * Builds `count` (default 3) anti-elimination distractors for a translation question.
 * Works uniformly across Daily Drills, Chapter Exams, and Final Exams.
 */
export function buildCloseTranslationDistractors(
  target: TranslationCandidate,
  pool: TranslationCandidate[],
  direction: 'zh-to-en' | 'en-to-zh',
  count = 3,
  rng: () => number = Math.random
): {
  distractors: string[];
  tagsUsed: string[];
  trapHint: string;
} {
  const isChinese = direction === 'en-to-zh';
  const targetText = isChinese ? target.hanzi : target.arabic;
  const rules = isChinese ? CHINESE_SWAP_RULES : ENGLISH_SWAP_RULES;

  const mut = generateMutatedVariants(targetText, rules, count, rng);
  const seen = new Set<string>([targetText, ...mut.variants]);
  const distractors = [...mut.variants];

  if (distractors.length < count) {
    const rankedFallbacks = rankCloseFallbacks(target, pool, direction, rng);
    for (const cand of rankedFallbacks) {
      if (distractors.length >= count) break;
      if (!seen.has(cand)) {
        seen.add(cand);
        distractors.push(cand);
      }
    }
  }

  const trapLabelList = mut.tagsUsed.slice(0, 3).join(' / ');
  const trapHint = isChinese
    ? mut.tagsUsed.length > 0
      ? `Inspect the exact Chinese ${trapLabelList} characters — distractors alter just one key detail.`
      : 'Verify every pronoun, negation, measure word, and time word against the English sentence.'
    : mut.tagsUsed.length > 0
      ? `Watch closely for subtle ${trapLabelList} traps among the choices.`
      : 'Compare every pronoun, negation, time expression, and verb carefully against the Chinese sentence.';

  return {
    distractors: distractors.slice(0, count),
    tagsUsed: mut.tagsUsed,
    trapHint,
  };
}

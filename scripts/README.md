## Using the Word Finder Script

The `scripts/find-words.js` script will:
1. Read the dictionary file
2. Find all words that can be made from your input letters
3. Calculate scores based on word length and commonness
4. Generate a JSON file ready for use in the game

### Usage Examples

```bash
# Using a word (script will count letters automatically)
npm run find-words "understanding"

# Using specific letter counts
npm run find-words "understanding" "u:1,n:3,d:2,e:1,r:1,s:1,t:1,a:1,i:1,g:1"

# For German words:
node scripts/find-words.js "verstehen" "de"
node scripts/find-words.js "verstehen" "v:1,e:2,r:1,s:1,t:1,h:1,n:1" "de"

```

### Output

The script will:
- Display letter counts and seed word
- Show the top 20 words by score
- Save a complete JSON file to `src/data/en/generated-level.json`
- The JSON file can be used directly in the game 
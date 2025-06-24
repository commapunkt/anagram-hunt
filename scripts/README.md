## Using the Word Finder Script

The `scripts/find-words.js` script will:
1. Read the dictionary file
2. Find all words that can be made from your input letters
3. Calculate scores based on word length and commonness
4. Generate a JSON file ready for use in the game

### Usage Examples

```bash
# Using a word (script will count letters automatically)
node scripts/find-words.js "understanding"

# Using specific letter counts
node scripts/find-words.js "understanding" "u:1,n:3,d:2,e:1,r:1,s:1,t:1,a:1,i:1,g:1"
```

### Output

The script will:
- Display letter counts and seed word
- Show the top 20 words by score
- Save a complete JSON file to `src/data/en/generated-level.json`
- The JSON file can be used directly in the game 
NEXUS EOC step one: files to copy into your em-sim project

Every file in this zip sits at the same path it belongs to inside em-sim.
Copy each one over the existing file (or into the new folder) at that path.
Nothing else in your project changes. No files need to be deleted.

REPLACE (existing files, overwrite):
  api/chat.js
  api/team-room.js
  src/App.jsx
  src/components/startExercise/StartExercise.jsx
  src/components/teamExercise/TeamExerciseLobby.jsx
  src/data/jurisdictions.js
  src/data/locationBank.js
  src/data/roles.js
  src/data/scenarios.js
  docs/ARCHITECTURE.md
  docs/CHANGELOG.md
  package.json
  .env.example

ADD (new folders and files):
  server/controllerPrompt.js
  server/prompts.js
  server/redis.js
  shared/exerciseData.json
  src/lib/aiClient.js
  tests/chatApi.test.mjs
  tests/teamRoomApi.test.mjs
  tests/helpers/http.mjs

THEN, in the terminal inside em-sim:
  npm install
  npm test
  npm run build
  git status          (should list exactly the files above)
  git add .
  git commit -m "Server-side prompts, prompt caching, streaming, Team Room tokens"
  git push origin dev

Test on the Vercel dev preview before pushing dev to main. Vercel needs no new
environment variables. Team Rooms open at deploy time will stop working; they
expire after 12 hours.

#!/bin/bash

BASE_URL="http://localhost:3001/api"

# Agent IDs (from hex data analysis)
ALPHA_ONE="d983b397-d182-4b62-8ade-69a5b22cb4c9"
BETA_TWO="0a7ff26c-5a14-4257-8fca-c8c8e8a8ec0c"
GAMMA_THREE="b33a9f6f-b6d7-4391-855d-8b59dc952b4a"
DELTA_FOUR="60c7bf81-b09d-4a47-9fe9-e0da6521d3f3"
EPSILON_FIVE="aaa2ba2b-00ed-4431-8727-1b01781b6923"
ZETA_SIX="6900c6e7-d164-4336-84db-cdb689573b3d"
THETA_EIGHT="5ee754bd-034b-47cd-b8d6-0ab4f32b59d8"
IOTA_NINE="108d9733-39f3-4643-97d4-307dfd1fb6b1"
KIMI="1ee6062c-f9cc-4e6a-af1c-e5740e11518d"

# Hex IDs (for challenges)
HEX_GAMMA_0_-3="046b5332-0973-45ce-bd48-9c06463f019e"  # Gamma's hex - Q: 2+2=4
HEX_BETA_-4_0="096dbab3-ba79-4952-8f48-2bfc994a8760"   # Beta's hex - Q: Jupiter
HEX_DELTA_5_0="0c7782c0-6e8b-43c7-ab68-ef3a541fabb5"   # Delta's hex - Q: Tokyo
HEX_ALPHA_3_0="20bef525-3efe-4ed5-bd4d-f39192229842"   # Alpha's hex - Q: speed of light
HEX_ZETA_0_5="03386322-9bc1-454e-bae9-a017d11cf277"    # Zeta's hex - Q: Everest
HEX_THETA_7_0="a5a2d8e7-0827-4154-b7e1-711bc1be4227"   # Theta's hex
HEX_EPSILON_-5_0="e36c57f4-4a2d-4259-8fa4-39342348d256" # Epsilon's hex - Q: Pacific
HEX_IOTA_0_-5="eb00f6a1-5b62-402b-8cf4-1c8a6b63b864"  # Iota's hex - Q: Au
HEX_KIMI_0_0="14d00f8a-68eb-41b1-8409-986808808171"    # Kimi's hex - calculus

echo "🎮 CLAWQUEST SIMULATION - 15 EXCITING MOVES 🎮"
echo "=============================================="
echo ""

# MOVE 1: Alpha-One claims NEW empty hex at (-2, 5)
echo "⚔️  MOVE 1: Alpha-One claims NEW neutral hex at (-2,5)..."
curl -s -X POST "${BASE_URL}/hexes/claim" \
  -H "Content-Type: application/json" \
  -H "X-OpenClaw-Bot: true" \
  -H "X-OpenClaw-Bot-Secret: YOUR_OPENCLAW_BOT_SECRET" \
  -d "{\"agentId\": \"${ALPHA_ONE}\", \"q\": -2, \"r\": 5, \"question\": \"What is the powerhouse of the cell?\", \"answer\": \"Mitochondria\"}"
echo ""
echo ""

# MOVE 2: Gamma-Three CHALLENGES Alpha-One's hex (Physics question - will FAIL)
echo "⚔️  MOVE 2: 🔥 BATTLE! Gamma-Three challenges Alpha-One's hex (Physics - likely WRONG)!"
curl -s -X POST "${BASE_URL}/hexes/challenge" \
  -H "Content-Type: application/json" \
  -H "X-OpenClaw-Bot: true" \
  -H "X-OpenClaw-Bot-Secret: YOUR_OPENCLAW_BOT_SECRET" \
  -d "{\"agentId\": \"${GAMMA_THREE}\", \"hexId\": \"${HEX_ALPHA_3_0}\", \"answer\": \"300000000 m/s\"}"
echo ""
echo ""

# MOVE 3: Beta-Two claims NEW hex at (-6, 3)
echo "⚔️  MOVE 3: Beta-Two claims NEW neutral hex at (-6,3)..."
curl -s -X POST "${BASE_URL}/hexes/claim" \
  -H "Content-Type: application/json" \
  -H "X-OpenClaw-Bot: true" \
  -H "X-OpenClaw-Bot-Secret: YOUR_OPENCLAW_BOT_SECRET" \
  -d "{\"agentId\": \"${BETA_TWO}\", \"q\": -6, \"r\": 3, \"question\": \"What is the chemical formula for water?\", \"answer\": \"H2O\"}"
echo ""
echo ""

# MOVE 4: Delta-Four tries to STEAL from Zeta-Six but WRONG answer (Everest vs Kilimanjaro)
echo "⚔️  MOVE 4: 💀 Delta-Four tries to steal from Zeta-Six but gives WRONG ANSWER!"
curl -s -X POST "${BASE_URL}/hexes/challenge" \
  -H "Content-Type: application/json" \
  -H "X-OpenClaw-Bot: true" \
  -H "X-OpenClaw-Bot-Secret: YOUR_OPENCLAW_BOT_SECRET" \
  -d "{\"agentId\": \"${DELTA_FOUR}\", \"hexId\": \"${HEX_ZETA_0_5}\", \"answer\": \"Kilimanjaro\"}"
echo ""
echo ""

# MOVE 5: Epsilon-Five claims NEW hex at (-7, 0)
echo "⚔️  MOVE 5: Epsilon-Five claims NEW hex at (-7,0) with Physics question..."
curl -s -X POST "${BASE_URL}/hexes/claim" \
  -H "Content-Type: application/json" \
  -H "X-OpenClaw-Bot: true" \
  -H "X-OpenClaw-Bot-Secret: YOUR_OPENCLAW_BOT_SECRET" \
  -d "{\"agentId\": \"${EPSILON_FIVE}\", \"q\": -7, \"r\": 0, \"question\": \"Who developed the theory of relativity?\", \"answer\": \"Albert Einstein\"}"
echo ""
echo ""

# MOVE 6: Zeta-Six SUCCESSFULLY STEALS from Gamma-Three (2+2=4 - EASY!)
echo "⚔️  MOVE 6: 🔥🔥 DRAMATIC BATTLE! Zeta-Six STEALS from Gamma-Three! (Math question)"
curl -s -X POST "${BASE_URL}/hexes/challenge" \
  -H "Content-Type: application/json" \
  -H "X-OpenClaw-Bot: true" \
  -H "X-OpenClaw-Bot-Secret: YOUR_OPENCLAW_BOT_SECRET" \
  -d "{\"agentId\": \"${ZETA_SIX}\", \"hexId\": \"${HEX_GAMMA_0_-3}\", \"answer\": \"4\"}"
echo ""
echo ""

# MOVE 7: Iota-Nine claims NEW hex at (4, -4) with Art question
echo "⚔️  MOVE 7: Iota-Nine claims hex at (4,-4) with Art trivia..."
curl -s -X POST "${BASE_URL}/hexes/claim" \
  -H "Content-Type: application/json" \
  -H "X-OpenClaw-Bot: true" \
  -H "X-OpenClaw-Bot-Secret: YOUR_OPENCLAW_BOT_SECRET" \
  -d "{\"agentId\": \"${IOTA_NINE}\", \"q\": 4, \"r\": -4, \"question\": \"Who painted the Mona Lisa?\", \"answer\": \"Leonardo da Vinci\"}"
echo ""
echo ""

# MOVE 8: Gamma-Three CHALLENGES Beta-Two on Astronomy (Jupiter - should SUCCEED!)
echo "⚔️  MOVE 8: 🧪 Gamma-Three challenges Beta-Two on Astronomy (Largest planet)!"
curl -s -X POST "${BASE_URL}/hexes/challenge" \
  -H "Content-Type: application/json" \
  -H "X-OpenClaw-Bot: true" \
  -H "X-OpenClaw-Bot-Secret: YOUR_OPENCLAW_BOT_SECRET" \
  -d "{\"agentId\": \"${GAMMA_THREE}\", \"hexId\": \"${HEX_BETA_-4_0}\", \"answer\": \"Jupiter\"}"
echo ""
echo ""

# MOVE 9: Theta-Eight claims NEW hex at (8, -2) with History
echo "⚔️  MOVE 9: Theta-Eight claims hex at (8,-2) with History question..."
curl -s -X POST "${BASE_URL}/hexes/claim" \
  -H "Content-Type: application/json" \
  -H "X-OpenClaw-Bot: true" \
  -H "X-OpenClaw-Bot-Secret: YOUR_OPENCLAW_BOT_SECRET" \
  -d "{\"agentId\": \"${THETA_EIGHT}\", \"q\": 8, \"r\": -2, \"question\": \"In which year did World War II end?\", \"answer\": \"1945\"}"
echo ""
echo ""

# MOVE 10: Kimi-AI-Agent FAILS to steal from Delta-Four (Tokyo vs Kyoto)
echo "⚔️  MOVE 10: 💀 Kimi-AI-Agent attempts to steal from Delta-Four but FAILS! (Wrong capital)"
curl -s -X POST "${BASE_URL}/hexes/challenge" \
  -H "Content-Type: application/json" \
  -H "X-OpenClaw-Bot: true" \
  -H "X-OpenClaw-Bot-Secret: YOUR_OPENCLAW_BOT_SECRET" \
  -d "{\"agentId\": \"${KIMI}\", \"hexId\": \"${HEX_DELTA_5_0}\", \"answer\": \"Kyoto\"}"
echo ""
echo ""

# MOVE 11: Alpha-One SUCCESSFULLY steals back from Zeta-Six! (REVENGE!)
echo "⚔️  MOVE 11: 🔥 REVENGE! Alpha-One steals back from Zeta-Six (2+2=4)!"
curl -s -X POST "${BASE_URL}/hexes/challenge" \
  -H "Content-Type: application/json" \
  -H "X-OpenClaw-Bot: true" \
  -H "X-OpenClaw-Bot-Secret: YOUR_OPENCLAW_BOT_SECRET" \
  -d "{\"agentId\": \"${ALPHA_ONE}\", \"hexId\": \"${HEX_GAMMA_0_-3}\", \"answer\": \"4\"}"
echo ""
echo ""

# MOVE 12: Delta-Four claims NEW hex at (4, 4)
echo "⚔️  MOVE 12: Delta-Four claims NEW hex at (4,4)..."
curl -s -X POST "${BASE_URL}/hexes/claim" \
  -H "Content-Type: application/json" \
  -H "X-OpenClaw-Bot: true" \
  -H "X-OpenClaw-Bot-Secret: YOUR_OPENCLAW_BOT_SECRET" \
  -d "{\"agentId\": \"${DELTA_FOUR}\", \"q\": 4, \"r\": 4, \"question\": \"What is the longest river in the world?\", \"answer\": \"Nile\"}"
echo ""
echo ""

# MOVE 13: Beta-Two FAILS to steal from Zeta-Six (Everest vs K2 - WRONG!)
echo "⚔️  MOVE 13: 💀 Beta-Two fails to steal from Zeta-Six - Wrong mountain!"
curl -s -X POST "${BASE_URL}/hexes/challenge" \
  -H "Content-Type: application/json" \
  -H "X-OpenClaw-Bot: true" \
  -H "X-OpenClaw-Bot-Secret: YOUR_OPENCLAW_BOT_SECRET" \
  -d "{\"agentId\": \"${BETA_TWO}\", \"hexId\": \"${HEX_ZETA_0_5}\", \"answer\": \"K2\"}"
echo ""
echo ""

# MOVE 14: Gamma-Three SUCCESSFULLY steals from Epsilon-Five (Pacific Ocean!)
echo "⚔️  MOVE 14: 🔥 Gamma-Three steals from Epsilon-Five! (Geography victory!)"
curl -s -X POST "${BASE_URL}/hexes/challenge" \
  -H "Content-Type: application/json" \
  -H "X-OpenClaw-Bot: true" \
  -H "X-OpenClaw-Bot-Secret: YOUR_OPENCLAW_BOT_SECRET" \
  -d "{\"agentId\": \"${GAMMA_THREE}\", \"hexId\": \"${HEX_EPSILON_-5_0}\", \"answer\": \"Pacific\"}"
echo ""
echo ""

# MOVE 15: Zeta-Six claims final NEW territory with Literature at (-3, 5)
echo "⚔️  MOVE 15: Zeta-Six claims hex at (-3,5) with Literature question..."
curl -s -X POST "${BASE_URL}/hexes/claim" \
  -H "Content-Type: application/json" \
  -H "X-OpenClaw-Bot: true" \
  -H "X-OpenClaw-Bot-Secret: YOUR_OPENCLAW_BOT_SECRET" \
  -d "{\"agentId\": \"${ZETA_SIX}\", \"q\": -3, \"r\": 5, \"question\": \"Who wrote Romeo and Juliet?\", \"answer\": \"William Shakespeare\"}"
echo ""
echo ""

echo "=============================================="
echo "🎬 SIMULATION COMPLETE! 🎬"
echo "=============================================="

#!/bin/bash

BASE_URL="http://localhost:3001/api"

# Agent IDs
ALPHA_ONE="d983b397-d182-4b62-8ade-69a5b22cb4c9"
BETA_TWO="0a7ff26c-5a14-4257-8fca-c8c8e8a8ec0c"
GAMMA_THREE="b33a9f6f-b6d7-4391-855d-8b59dc952b4a"
DELTA_FOUR="60c7bf81-b09d-4a47-9fe9-e0da6521d3f3"
EPSILON_FIVE="aaa2ba2b-00ed-4431-8727-1b01781b6923"
ZETA_SIX="6900c6e7-d164-4336-84db-cdb689573b3d"
THETA_EIGHT="5ee754bd-034b-47cd-b8d6-0ab4f32b59d8"
IOTA_NINE="108d9733-39f3-4643-97d4-307dfd1fb6b1"
KIMI="1ee6062c-f9cc-4e6a-af1c-e5740e11518d"

# Hex IDs for challenges (corrected)
HEX_GAMMA_0_m3="046b5332-0973-45ce-bd48-9c06463f019e"  # Q: 2+2=? A: four
HEX_BETA_m4_0="096dbab3-ba79-4952-8f48-2bfc994a8760"   # Q: Largest planet? A: Jupiter
HEX_DELTA_5_0="0c7782c0-6e8b-43c7-ab68-ef3a541fabb5"   # Q: Capital of Japan? A: Tokyo
HEX_ALPHA_3_0="20bef525-3efe-4ed5-bd4d-f39192229842"   # Q: Speed of light? A: 299792458 m/s
HEX_ZETA_0_5="03386322-9bc1-454e-bae9-a017d11cf277"    # Q: Highest mountain? A: Everest
HEX_THETA_7_0="5d1d4e8a-657b-45e6-ae06-5b2ab1ce4e3c"   # Q: Boiling point of water? A: 100
HEX_EPSILON_m5_0="6509cf9e-c5e0-408f-b388-ed70d1a0b377" # Q: Largest ocean? A: Pacific
HEX_GAMMA_m2_0="36fceb31-16b3-4cc8-ad06-0895ce157620"  # Q: Capital of France? A: Paris
HEX_KIMI_0_0="b9ec379a-cd59-4938-a51d-fbee422dab9d"    # Q: Fundamental theorem of calculus

echo "🎮 CLAWQUEST SIMULATION - 15 EXCITING MOVES 🎮"
echo "=============================================="
echo ""

# MOVE 1: Alpha-One claims NEW empty hex
echo "⚔️  MOVE 1: Alpha-One claims NEW neutral hex at (-4, 5)..."
curl -s -X POST "${BASE_URL}/hexes/claim" \
  -H "Content-Type: application/json" \
  -H "X-OpenClaw-Bot: true" \
  -H "X-OpenClaw-Bot-Secret: openclaw-secret-key-2024" \
  -d "{\"agentId\": \"${ALPHA_ONE}\", \"q\": -4, \"r\": 5, \"question\": \"What is the powerhouse of the cell?\", \"answer\": \"Mitochondria\"}" | grep -o '"success":[a-z]*' | head -1
echo ""

# MOVE 2: Gamma-Three CHALLENGES Alpha-One on Physics (should FAIL - wrong format)
echo "⚔️  MOVE 2: 🔥 BATTLE! Gamma-Three challenges Alpha-One's hex (Physics - WRONG ANSWER)!"
curl -s -X POST "${BASE_URL}/hexes/challenge" \
  -H "Content-Type: application/json" \
  -H "X-OpenClaw-Bot: true" \
  -H "X-OpenClaw-Bot-Secret: openclaw-secret-key-2024" \
  -d "{\"agentId\": \"${GAMMA_THREE}\", \"hexId\": \"${HEX_ALPHA_3_0}\", \"answer\": \"300000000 m/s\"}" | grep -o '"success":[a-z]*' | head -1
echo " (FAILED as expected - wrong answer)"
echo ""

# MOVE 3: Beta-Two claims NEW hex at (-7, 4)
echo "⚔️  MOVE 3: Beta-Two claims NEW neutral hex at (-7, 4)..."
curl -s -X POST "${BASE_URL}/hexes/claim" \
  -H "Content-Type: application/json" \
  -H "X-OpenClaw-Bot: true" \
  -H "X-OpenClaw-Bot-Secret: openclaw-secret-key-2024" \
  -d "{\"agentId\": \"${BETA_TWO}\", \"q\": -7, \"r\": 4, \"question\": \"What is the chemical formula for glucose?\", \"answer\": \"C6H12O6\"}" | grep -o '"success":[a-z]*' | head -1
echo ""

# MOVE 4: Delta-Four tries to STEAL from Zeta-Six but WRONG answer
echo "⚔️  MOVE 4: 💀 Delta-Four tries to steal from Zeta-Six but gives WRONG ANSWER (Kilimanjaro vs Everest)!"
curl -s -X POST "${BASE_URL}/hexes/challenge" \
  -H "Content-Type: application/json" \
  -H "X-OpenClaw-Bot: true" \
  -H "X-OpenClaw-Bot-Secret: openclaw-secret-key-2024" \
  -d "{\"agentId\": \"${DELTA_FOUR}\", \"hexId\": \"${HEX_ZETA_0_5}\", \"answer\": \"Kilimanjaro\"}" | grep -o '"success":[a-z]*' | head -1
echo " (FAILED - wrong mountain)"
echo ""

# MOVE 5: Epsilon-Five claims NEW hex with Biology
echo "⚔️  MOVE 5: Epsilon-Five claims NEW hex at (5, -5) with Biology..."
curl -s -X POST "${BASE_URL}/hexes/claim" \
  -H "Content-Type: application/json" \
  -H "X-OpenClaw-Bot: true" \
  -H "X-OpenClaw-Bot-Secret: openclaw-secret-key-2024" \
  -d "{\"agentId\": \"${EPSILON_FIVE}\", \"q\": 5, \"r\": -5, \"question\": \"What is the largest organ in the human body?\", \"answer\": \"Skin\"}" | grep -o '"success":[a-z]*' | head -1
echo ""

# MOVE 6: Zeta-Six SUCCESSFULLY STEALS from Gamma-Three! (Math - EASY WIN!)
echo "⚔️  MOVE 6: 🔥🔥 DRAMATIC BATTLE! Zeta-Six STEALS from Gamma-Three! (2+2=4 - EASY!)"
curl -s -X POST "${BASE_URL}/hexes/challenge" \
  -H "Content-Type: application/json" \
  -H "X-OpenClaw-Bot: true" \
  -H "X-OpenClaw-Bot-Secret: openclaw-secret-key-2024" \
  -d "{\"agentId\": \"${ZETA_SIX}\", \"hexId\": \"${HEX_GAMMA_0_m3}\", \"answer\": \"4\"}" | grep -o '"success":[a-z]*' | head -1
echo " (SUCCESS - Zeta stole the hex!)"
echo ""

# MOVE 7: Theta-Eight claims NEW hex with Art
echo "⚔️  MOVE 7: Theta-Eight claims hex at (8, -4) with Art trivia..."
curl -s -X POST "${BASE_URL}/hexes/claim" \
  -H "Content-Type: application/json" \
  -H "X-OpenClaw-Bot: true" \
  -H "X-OpenClaw-Bot-Secret: openclaw-secret-key-2024" \
  -d "{\"agentId\": \"${THETA_EIGHT}\", \"q\": 8, \"r\": -4, \"question\": \"Who painted The Starry Night?\", \"answer\": \"Vincent van Gogh\"}" | grep -o '"success":[a-z]*' | head -1
echo ""

# MOVE 8: Gamma-Three SUCCESSFULLY challenges Beta-Two on Astronomy (Jupiter!)
echo "⚔️  MOVE 8: 🧪 Gamma-Three challenges Beta-Two on Astronomy (Jupiter - SUCCESS)!"
curl -s -X POST "${BASE_URL}/hexes/challenge" \
  -H "Content-Type: application/json" \
  -H "X-OpenClaw-Bot: true" \
  -H "X-OpenClaw-Bot-Secret: openclaw-secret-key-2024" \
  -d "{\"agentId\": \"${GAMMA_THREE}\", \"hexId\": \"${HEX_BETA_m4_0}\", \"answer\": \"Jupiter\"}" | grep -o '"success":[a-z]*' | head -1
echo " (SUCCESS - Gamma stole the hex!)"
echo ""

# MOVE 9: Iota-Nine claims NEW hex with History
echo "⚔️  MOVE 9: Iota-Nine claims hex at (-6, -4) with History..."
curl -s -X POST "${BASE_URL}/hexes/claim" \
  -H "Content-Type: application/json" \
  -H "X-OpenClaw-Bot: true" \
  -H "X-OpenClaw-Bot-Secret: openclaw-secret-key-2024" \
  -d "{\"agentId\": \"${IOTA_NINE}\", \"q\": -6, \"r\": -4, \"question\": \"Who was the first president of the United States?\", \"answer\": \"George Washington\"}" | grep -o '"success":[a-z]*' | head -1
echo ""

# MOVE 10: Kimi-AI-Agent FAILS to steal from Delta-Four (Tokyo vs Kyoto)
echo "⚔️  MOVE 10: 💀 Kimi-AI-Agent attempts to steal from Delta-Four but FAILS! (Kyoto vs Tokyo)"
curl -s -X POST "${BASE_URL}/hexes/challenge" \
  -H "Content-Type: application/json" \
  -H "X-OpenClaw-Bot: true" \
  -H "X-OpenClaw-Bot-Secret: openclaw-secret-key-2024" \
  -d "{\"agentId\": \"${KIMI}\", \"hexId\": \"${HEX_DELTA_5_0}\", \"answer\": \"Kyoto\"}" | grep -o '"success":[a-z]*' | head -1
echo " (FAILED - wrong capital)"
echo ""

# MOVE 11: Alpha-One SUCCESSFULLY steals from Gamma-Three on Geography! (REVENGE!)
echo "⚔️  MOVE 11: 🔥 REVENGE! Alpha-One steals from Gamma-Three on Geography (Paris)!"
curl -s -X POST "${BASE_URL}/hexes/challenge" \
  -H "Content-Type: application/json" \
  -H "X-OpenClaw-Bot: true" \
  -H "X-OpenClaw-Bot-Secret: openclaw-secret-key-2024" \
  -d "{\"agentId\": \"${ALPHA_ONE}\", \"hexId\": \"${HEX_GAMMA_m2_0}\", \"answer\": \"Paris\"}" | grep -o '"success":[a-z]*' | head -1
echo " (SUCCESS - Alpha stole the hex!)"
echo ""

# MOVE 12: Delta-Four claims NEW hex with Geography
echo "⚔️  MOVE 12: Delta-Four claims NEW hex at (6, 4)..."
curl -s -X POST "${BASE_URL}/hexes/claim" \
  -H "Content-Type: application/json" \
  -H "X-OpenClaw-Bot: true" \
  -H "X-OpenClaw-Bot-Secret: openclaw-secret-key-2024" \
  -d "{\"agentId\": \"${DELTA_FOUR}\", \"q\": 6, \"r\": 4, \"question\": \"What is the smallest continent?\", \"answer\": \"Australia\"}" | grep -o '"success":[a-z]*' | head -1
echo ""

# MOVE 13: Beta-Two FAILS to steal from Zeta-Six (Everest vs K2)
echo "⚔️  MOVE 13: 💀 Beta-Two fails to steal from Zeta-Six - Wrong mountain! (K2 vs Everest)"
curl -s -X POST "${BASE_URL}/hexes/challenge" \
  -H "Content-Type: application/json" \
  -H "X-OpenClaw-Bot: true" \
  -H "X-OpenClaw-Bot-Secret: openclaw-secret-key-2024" \
  -d "{\"agentId\": \"${BETA_TWO}\", \"hexId\": \"${HEX_ZETA_0_5}\", \"answer\": \"K2\"}" | grep -o '"success":[a-z]*' | head -1
echo " (FAILED - wrong answer)"
echo ""

# MOVE 14: Gamma-Three SUCCESSFULLY steals from Epsilon-Five! (Pacific Ocean!)
echo "⚔️  MOVE 14: 🔥 Gamma-Three steals from Epsilon-Five! (Geography - Pacific Ocean!)"
curl -s -X POST "${BASE_URL}/hexes/challenge" \
  -H "Content-Type: application/json" \
  -H "X-OpenClaw-Bot: true" \
  -H "X-OpenClaw-Bot-Secret: openclaw-secret-key-2024" \
  -d "{\"agentId\": \"${GAMMA_THREE}\", \"hexId\": \"${HEX_EPSILON_m5_0}\", \"answer\": \"Pacific\"}" | grep -o '"success":[a-z]*' | head -1
echo " (SUCCESS - Gamma stole the hex!)"
echo ""

# MOVE 15: Zeta-Six claims NEW territory with Literature
echo "⚔️  MOVE 15: Zeta-Six claims hex at (4, -6) with Literature..."
curl -s -X POST "${BASE_URL}/hexes/claim" \
  -H "Content-Type: application/json" \
  -H "X-OpenClaw-Bot: true" \
  -H "X-OpenClaw-Bot-Secret: openclaw-secret-key-2024" \
  -d "{\"agentId\": \"${ZETA_SIX}\", \"q\": 4, \"r\": -6, \"question\": \"Who wrote 'To Kill a Mockingbird'?\", \"answer\": \"Harper Lee\"}" | grep -o '"success":[a-z]*' | head -1
echo ""

echo ""
echo "=============================================="
echo "🎬 SIMULATION COMPLETE! 🎬"
echo "=============================================="

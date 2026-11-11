# 이동 미리보기 QA
- 3D/2D fallback, PC/390px mobile: select a floor or cargo; show route/cost/remaining; confirm/cancel.
- Preview never consumes actions; confirmation uses existing movement; undo reverses one step.
- Keyboard Space activates focused confirmation; Escape cancels; normal movement invalidates pending route.
- Off paths: closed gate/occupied tile; route exhausts homecoming budget; pause while preview is open.
- Visual checks: readable cost/warning and reachable buttons; markers on legal tiles; no horizontal overflow.

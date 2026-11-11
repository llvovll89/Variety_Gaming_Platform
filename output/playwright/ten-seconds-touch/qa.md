# Ten Seconds touch QA

Coverage: lobby without dock; portrait 390x844, small 320x568, landscape 844x390, desktop 1440x900; reserved shell/dock geometry and no horizontal overflow; 44px controls; pointer movement and rewind echo update; modal inert controls; desktop rewind retained. Exploratory: orientation change during play; scrolling to bottom while controls remain accessible.

Results: 390x844, 320x568 and 844x390 passed: shell bottom equals dock top; no horizontal overflow; direction buttons 48x44. Actual pointer hold and rewind produced echo 1/4. Ready modal dock inert; lobby dock absent. Desktop dock hidden and original rewind visible. Orientation change and scrolling retained controls. Screenshots visually reviewed for small portrait, landscape and scrolled portrait. Full tests 337/337; production build passed with existing Three.js chunk warning. Chromium touch emulation only; physical mobile devices not tested.

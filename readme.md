# Project

## Description
This is an application for NBA players’ shot data visualization. By adopting multi-level data categorization and various interaction techniques, the application supports a general view of specific player’s shot frequency in different areas of the court and a detailed view of his action type frequency corresponding to the selected shot range.

## Dataset Collection
I utilize NBA_API to extract desired data from NBA.com in the 2023-24 regular season. The finalized dataset includes categorial attributes (e.g., player id, game id, and action type), spatial attributes (e.g., shot position of x, y coordinates on the court), and temporal attributes (e.g., time remaining in minutes and seconds).

## Execution
1. Go to the directory 'path/to/nba-visualization'
2. Execute 'python -m  http.server' in the command line
3. Open the address "http://localhost:8000" in the browser
4. Select a player in the drop down list for visualization
5. Click one of the bars on the left side to obtain more detailed shot information 

## Notice
It is recommended to clear the cache of the browser first.

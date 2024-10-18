from nba_api.stats.static import players
from nba_api.stats.endpoints import shotchartdetail
from nba_api.stats.endpoints import playercareerstats
import pandas as pd

def get_player_shotchartdetail(player_name, season_id):
    """
    Parameters
    ----------
    player_name: name of the player with Capital
    season_id: ex. 2012-13
    """
    
    # player dictionary
    nba_players = players.get_players()
    player_dict = [player for player in nba_players if player['full_name'] == player_name][0]
    
    # career df
    career = playercareerstats.PlayerCareerStats(player_id=player_dict['id'])
    career_df = career.get_data_frames()[0]
    
    # team id during the season
    team_id = career_df[career_df['SEASON_ID'] == season_id]['TEAM_ID']
    
    # shotchardtdetail endpoint
    shotchartlist = shotchartdetail.ShotChartDetail(team_id=int(team_id), 
                                                   player_id=int(player_dict['id']), 
                                                   season_type_all_star='Regular Season', 
                                                   season_nullable=season_id,
                                                   context_measure_simple="FGA").get_data_frames()
    
    return shotchartlist[0]

# List of players
player_names = ['Giannis Antetokounmpo', 'Kawhi Leonard', 'Kevin Durant', 'LeBron James', 'Luka Doncic', 'Nikola Jokic', 'Stephen Curry']

# Season ID
season_id = '2023-24'

# Initialize an empty list to store DataFrames
dfs = []

# Iterate through each player
for player_name in player_names:
    # Get shotchart data for the player
    player_shotchart_df = get_player_shotchartdetail(player_name, season_id)
    # Append DataFrame to the list
    dfs.append(player_shotchart_df)

# Concatenate all DataFrames into one
combined_df = pd.concat(dfs, ignore_index=True)

# Save the combined DataFrame to a new CSV file
combined_df.to_csv('combined_player_shotchart.csv', index=False)
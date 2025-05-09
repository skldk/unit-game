import Airtable from 'airtable';

// Инициализация Airtable с Personal Access Token
const base = new Airtable({
  apiKey: process.env.REACT_APP_AIRTABLE_PERSONAL_ACCESS_TOKEN,
  endpointUrl: 'https://api.airtable.com'
}).base(process.env.REACT_APP_AIRTABLE_BASE_ID || '');

const TABLE_NAME = 'Leaderboard';

export type LeaderboardEntry = {
  id: string;
  nickname: string;
  profitNet: number;
  date: string;
  isCurrentPlayer?: boolean;
};

export async function getLeaderboard(): Promise<LeaderboardEntry[]> {
  try {
    const records = await base(TABLE_NAME)
      .select({
        maxRecords: 10,
        sort: [{ field: 'profitNet', direction: 'desc' }]
      })
      .all();

    return records.map(record => ({
      id: record.id,
      nickname: record.get('nickname') as string,
      profitNet: record.get('profitNet') as number,
      date: record.get('date') as string,
      isCurrentPlayer: false
    }));
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return [];
  }
}

export async function addToLeaderboard(entry: Omit<LeaderboardEntry, 'id' | 'date'>): Promise<LeaderboardEntry | null> {
  try {
    const record = await base(TABLE_NAME).create({
      nickname: entry.nickname,
      profitNet: entry.profitNet,
      date: new Date().toISOString()
    });

    return {
      id: record.id,
      nickname: record.get('nickname') as string,
      profitNet: record.get('profitNet') as number,
      date: record.get('date') as string,
      isCurrentPlayer: true
    };
  } catch (error) {
    console.error('Error adding to leaderboard:', error);
    return null;
  }
} 
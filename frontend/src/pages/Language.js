import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';


const Language = () => {
  
  const [topSongData, setTopSongData] = useState('');
  const [timeRange, setTimeRange] = useState("long_term");
  const [uncertain, setUncertain] = useState(0);
  const [loading, setLoading] = useState(false);

  const COLORS = [
    '#0088FE', '#00C49F', '#FFBB28', '#FF8042',
    '#AF19FF', '#FF4560', '#FF6384', '#36A2EB',
    '#4BC0C0', '#9966FF', '#C9CBCF', '#F67019'
  ];
  
  

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `http://localhost:5000/song-lyrics?time_range=${encodeURIComponent(timeRange)}`
        );
    
        console.log(response);
        const data = await response.json();
        let sum = 0;
        for (const lang in data.languages) {
          if (data.languages[lang] < .9) {
            delete data.languages[lang];
          }
          if (data.languages[lang]) {
            sum += data.languages[lang];
          }
        }

        if (sum < 100) {
          setUncertain(100 - sum);
        }
        data.languages['Uncertain'] = uncertain.toFixed(2);
    
        const topSongData = data.languages;

      setTopSongData(topSongData || 'top songs languages could not be determined.');
      } catch (error) {
        setTopSongData('Error fetching top songs.');
      }
      setLoading(false);
    };

    fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeRange]);  

  return (
    <div className="ml-32 mt-16">

      <div className="flex justify-between space-x-6 mr-16 min-h-[130px]">
        <h1 className="text-5xl font-bold ml-16 w-1/2">
          Discover Language trends!
        </h1>

        <div className="flex space-x-4 mt-6 ml-16 mr-16 w-1/2">
        <button 
            onClick={() => setTimeRange("short_term")} 
            className={`px-4 py-2 max-w-[110px] rounded-full ${timeRange === "short_term" ? "bg-green-500" : "bg-gray-900"} text-white`}>
              Last 3 Months
          </button>
          <button 
            onClick={() => setTimeRange("medium_term")} 
            className={`px-4 py-2 max-w-[110px] rounded-full ${timeRange === "medium_term" ? "bg-green-500" : "bg-gray-900"} text-white`}>
              Last 6 Months
          </button>
          <button 
              onClick={() => setTimeRange("long_term")} 
              className={`px-4 py-2 max-w-[110px] rounded-full ${timeRange === "long_term" ? "bg-green-500" : "bg-gray-900"} text-white`}>
                Last 12 Months
              </button>
        </div>
    </div>

    <div className="mt-8">

        {loading ? (
          <p>Loading...</p>
        ) : ( 
          topSongData && (
          <div className="mt-8 w-full max-w-xl min-h-[300px] ml-16">
            <h2 className="text-xl font-semibold mb-4">Language Distribution</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={Object.entries(topSongData).map(([language, value]) => ({
                    name: language,
                    value: value,
                  }))}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label
                >
                  {Object.keys(topSongData).map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
          )
        )}
          </div>
    </div>
  );
};

export default Language;

function formatTime(ms) {
  let totalSeconds = Math.floor(ms / 1000);
  let hours = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
  let minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
  let seconds = String(totalSeconds % 60).padStart(2, '0');

  return `${hours}:${minutes}:${seconds}`;
}

document.addEventListener('DOMContentLoaded', () => {
  const totalTimeElement = document.getElementById('total-time');
  const timeListElement = document.getElementById('time-list');
  const resetButton = document.getElementById('reset');
  const saveButton = document.getElementById('save');

  chrome.storage.local.get('timeData', data => {
    let timeData = data.timeData || {};
    let totalMilliseconds = 0;

    if (Object.keys(timeData).length === 0) {
      timeListElement.textContent = 'データがありません。';
      totalTimeElement.textContent = '総視聴時間: 00:00:00';
    } else {
      timeListElement.innerHTML = '';
      for (let date in timeData) {
        let timeMs = timeData[date];
        totalMilliseconds += timeMs;

        let div = document.createElement('div');
        div.className = 'date-item';
        div.textContent = `${date}: ${formatTime(timeMs)}`;
        timeListElement.appendChild(div);
      }
      totalTimeElement.textContent = `総視聴時間: ${formatTime(totalMilliseconds)}`;
    }
  });

  resetButton.addEventListener('click', () => {
    chrome.storage.local.set({ timeData: {} }, () => {
      timeListElement.textContent = 'データがリセットされました。';
      totalTimeElement.textContent = '総視聴時間: 00:00:00';
    });
  });

  saveButton.addEventListener('click', () => {
    chrome.storage.local.get('timeData', data => {
      let timeData = data.timeData || {};
      if (Object.keys(timeData).length === 0) {
        alert('保存するデータがありません。');
        return;
      }

      let csvContent = '日付,視聴時間（hh:mm:ss）\n';
      let totalMilliseconds = 0;
      let dates = Object.keys(timeData).sort();

      for (let date of dates) {
        let timeMs = timeData[date];
        totalMilliseconds += timeMs;
        let formattedTime = formatTime(timeMs);
        csvContent += `${date},${formattedTime}\n`;
      }

      // 累積時間をCSVに追加
      csvContent += `総視聴時間,${formatTime(totalMilliseconds)}\n`;

      // CSVファイルを生成してダウンロード
      let blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      let url = URL.createObjectURL(blob);

      // ダウンロード用のリンクを作成
      let link = document.createElement('a');
      link.href = url;
      let now = new Date();
      let filename = `YouTube_TimeData_${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}.csv`;
      link.download = filename;

      // リンクをクリックしてダウンロードを実行
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    });
  });
});

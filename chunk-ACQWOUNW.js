import{c as l,j as c}from"./chunk-ME3KJURG.js";import{a as p,b as h}from"./chunk-RNMDN42R.js";var m=class d{storageKey="contests";contestsSubject=new l(this.loadContests());backupReminderSubject=new l(!1);contests$=this.contestsSubject.asObservable();backupReminder$=this.backupReminderSubject.asObservable();loadContests(){let t=localStorage.getItem(this.storageKey);if(!t)return[];try{return JSON.parse(t).map(e=>this.normalizeContest(e))}catch{return[]}}normalizeContest(t){return h(p({},t),{date:new Date(t.date),matchName:t.matchName?.trim()||void 0,tournament:t.tournament?.trim()||void 0,contestType:t.contestType?.trim()||void 0,notes:t.notes?.trim()||void 0,participants:t.participants??[],results:t.results??[],isCompleted:t.isCompleted??!1})}saveContests(t){localStorage.setItem(this.storageKey,JSON.stringify(t))}markBackupReminderPending(t){this.backupReminderSubject.next(t.length>0)}getContests(){return this.contestsSubject.value}addContest(t){let n=[...this.getContests(),this.normalizeContest(t)];this.saveContests(n),this.contestsSubject.next(n),this.markBackupReminderPending(n)}addManyContests(t){let n=this.getContests(),e=t.map(o=>this.normalizeContest(o)),s=[...n,...e];this.saveContests(s),this.contestsSubject.next(s),this.markBackupReminderPending(s)}replaceContests(t){let n=t.map(e=>this.normalizeContest(e));this.saveContests(n),this.contestsSubject.next(n),this.markBackupReminderPending(n)}updateContest(t){let n=this.getContests().map(e=>e.id===t.id?this.normalizeContest(t):e);this.saveContests(n),this.contestsSubject.next(n),this.markBackupReminderPending(n)}deleteContest(t){let n=this.getContests().filter(e=>e.id!==t);this.saveContests(n),this.contestsSubject.next(n),this.markBackupReminderPending(n)}dismissBackupReminder(){this.backupReminderSubject.next(!1)}downloadBackupFile(){let t=this.getContests();if(!t.length)return;let n=JSON.stringify(t,null,2),e=document.createElement("a");e.setAttribute("href",`data:text/plain;charset=utf-8,${encodeURIComponent(n)}`),e.setAttribute("download",`contests-backup-${Date.now()}.json`),e.style.display="none",document.body.appendChild(e),e.click(),document.body.removeChild(e),this.dismissBackupReminder()}exportContestsPdf(t){if(!t.length)return;let n=t.map((e,s)=>{let o=e.participants.reduce((r,i)=>r+i.entryCount,0),a=e.participants.reduce((r,i)=>r+e.entryFee*i.entryCount,0);return`
          <tr>
            <td>${s+1}</td>
            <td>${this.escapeHtml(e.name)}</td>
            <td>${new Date(e.date).toLocaleDateString()}</td>
            <td>${e.winner?this.escapeHtml(e.winner):"-"}</td>
            <td>${e.participants.length}</td>
            <td>${o}</td>
            <td>Rs ${a.toLocaleString()}</td>
            <td>${e.isCompleted?"Completed":"Pending"}</td>
          </tr>
        `}).join("");this.openPrintWindow(`
      <h1>Fantasy Contest Tracker - Contest Report</h1>
      <p>Generated on: ${new Date().toLocaleString()}</p>
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Contest</th>
            <th>Date</th>
            <th>Winner</th>
            <th>Participants</th>
            <th>Entries</th>
            <th>Invested</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>${n}</tbody>
      </table>
    `,"contest-report")}exportSingleContestPdf(t){let n=t.participants.map((e,s)=>{let o=t.results?.find(u=>u.playerId===e.id),a=o?.winningAmount??0,r=e.entryCount*t.entryFee,i=a-r;return`
          <tr>
            <td>${s+1}</td>
            <td>${this.escapeHtml(e.name)}</td>
            <td>${e.entryCount}</td>
            <td>${o?.rank??"-"}</td>
            <td>Rs ${a.toLocaleString()}</td>
            <td>${i>0?"+":""}Rs ${i.toLocaleString()}</td>
          </tr>
        `}).join("");this.openPrintWindow(`
      <h1>${this.escapeHtml(t.name)} - Contest Detail</h1>
      <p>Date: ${new Date(t.date).toLocaleString()}</p>
      <p>Status: ${t.isCompleted?"Completed":"Pending"}</p>
      <p>Entry Fee: Rs ${t.entryFee}</p>
      <p>Winner: ${t.winner?this.escapeHtml(t.winner):"Not set"}</p>
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Player</th>
            <th>Entries</th>
            <th>Rank</th>
            <th>Winnings</th>
            <th>P/L</th>
          </tr>
        </thead>
        <tbody>${n}</tbody>
      </table>
    `,`contest-${t.id}`)}exportDashboardPdf(t){let n=t.playerStats.map((e,s)=>{let o=e.totalInvested?e.profitLoss/e.totalInvested*100:0;return`
          <tr>
            <td>${s+1}</td>
            <td>${this.escapeHtml(e.name)}</td>
            <td>${e.contestsParticipated}</td>
            <td>${e.winnerCount}</td>
            <td>Rs ${e.totalInvested.toLocaleString()}</td>
            <td>Rs ${e.totalWinnings.toLocaleString()}</td>
            <td>${e.profitLoss>0?"+":""}Rs ${e.profitLoss.toLocaleString()}</td>
            <td>${o.toFixed(1)}%</td>
          </tr>
        `}).join("");this.openPrintWindow(`
      <h1>Fantasy Contest Tracker - Dashboard Report</h1>
      <p>Generated on: ${t.generatedAt.toLocaleString()}</p>
      <h2>Summary</h2>
      <p>Total Contests: ${t.totalContests}</p>
      <p>Completed Contests: ${t.completedContests}</p>
      <p>Total Entries: ${t.totalEntries}</p>
      <p>Total Invested: Rs ${t.totalInvested.toLocaleString()}</p>
      <p>Total Winnings: Rs ${t.totalWinnings.toLocaleString()}</p>
      <p>Group P/L: ${t.groupProfitLoss>0?"+":""}Rs ${t.groupProfitLoss.toLocaleString()}</p>
      <h2>Highlights</h2>
      <p>Best Performing User: ${this.escapeHtml(t.bestPerformingUser)}</p>
      <p>Most Active Player: ${this.escapeHtml(t.mostActivePlayer)}</p>
      <p>Most Inactive Player: ${this.escapeHtml(t.mostInactivePlayer)}</p>
      <h2>Player Rankings</h2>
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Player</th>
            <th>Contests</th>
            <th>Wins</th>
            <th>Invested</th>
            <th>Winnings</th>
            <th>P/L</th>
            <th>ROI</th>
          </tr>
        </thead>
        <tbody>${n}</tbody>
      </table>
    `,"dashboard-report")}openPrintWindow(t,n){let e=window.open("","_blank","width=1000,height=700");e&&(e.document.write(`
      <html>
      <head>
        <title>${this.escapeHtml(n)}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 24px; color: #1a1a1a; }
          h1 { margin: 0 0 10px; }
          p { margin: 4px 0; }
          table { width: 100%; border-collapse: collapse; margin-top: 16px; }
          th, td { border: 1px solid #d0d7de; padding: 8px; text-align: left; font-size: 13px; }
          th { background: #f5f8fa; }
        </style>
      </head>
      <body>
        ${t}
      </body>
      </html>
    `),e.document.close(),e.focus(),e.print())}escapeHtml(t){return t.replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#39;")}static \u0275fac=function(n){return new(n||d)};static \u0275prov=c({token:d,factory:d.\u0275fac,providedIn:"root"})};export{m as a};

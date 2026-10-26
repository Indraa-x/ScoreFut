import {recordAchievementProgress} from './achievements.js?v=browser-achievements-20261025';

/** Save the small lifetime ledger before pruning the detailed campaign archive. */
export function saveCampaignProgress(record,history,ledger,storage){
  const previous=Array.isArray(history)?history:[];
  const nextLedger=recordAchievementProgress(record,previous,ledger);
  const existing=previous.some(item=>item?.id===record?.id);
  const nextHistory=(existing?[...previous]:[...previous,record]).slice(-50);
  const write=(key,value)=>{try{return storage.write(key,value)===true;}catch{return false;}};

  let ledgerSaved=write('achievements',nextLedger);
  let historySaved=write('history',nextHistory);
  if(ledgerSaved||historySaved){
    // A durable completion now exists, so the unfinished snapshot can release quota.
    try{storage.remove('active');}catch{/* Failed retries below still report their status. */}
    if(!ledgerSaved)ledgerSaved=write('achievements',nextLedger);
    if(!historySaved)historySaved=write('history',nextHistory);
  }
  return {ledger:nextLedger,ledgerSaved,historySaved};
}

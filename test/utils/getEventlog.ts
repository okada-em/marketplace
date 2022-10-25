import {Event} from "ethers";

export const getEventLog = (
  events: Array<Event>|undefined,
  eventName: string
) : Event | null => {
  let result: Event|null = null;
  if(!events) return result;

  for(let i = 0; i < events.length; i++){
    if(events[i].event === eventName){
      result = events[i];
      break;
    }
  }
  return result;
}

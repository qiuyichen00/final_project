import React, { useState, useEffect,useReducer } from 'react';

import { fetchDailyData } from '../../api';

import { Line} from 'react-chartjs-2';

import styles from './SIR.module.css';

const SIRchart=()=>{
  const [dailyData, setDailyData] = useState({});

  useEffect(() => {
    const fetchMyAPI = async () => {
      const initialDailyData = await fetchDailyData();
      
      setDailyData(initialDailyData);
    };

    fetchMyAPI();
  }, []);

  const [userInput, setUserInput] = useReducer(
    (state, newState) => ({...state, ...newState}),
    {
    Population:30000,
    Confirmed:1000,
    Pre_confirmed:600,
    Recovered:300,
    Death:30,
    }
  );
  const[submit,setSubmit]=useState(0);
  useEffect(()=>{
    setPrediction(SIRInput(userInput));
  },[submit,])

// handle the form inputs
  const handleChange = evt => {
    const name = evt.target.name;
    const newValue = parseInt(evt.target.value);
    setUserInput({[name]: newValue});
  }
//handle the submit button for form
  const handleSubmit = (evt) => {
    evt.preventDefault();
    setSubmit(submit+1);
}

  const [prediction,setPrediction] = useState(null);
  

let SIRInput =(input)=>{
  if(input.Population==0) return null;
  // get inputs and initial data for SIR
  let iniconfirmed = input.Confirmed;
  let initotal = input.Population;
  let inirecovered = input.Recovered;
  let inideath = input.Death;
  let iniinfected = iniconfirmed - input.Pre_confirmed;
  let inisuspected = initotal - iniconfirmed;
  let iniremoved = inirecovered + inideath;
  // estimate the death rate by the data on last day
  let deathRate = inideath/iniremoved;
  // get doubling time by using last 5 days (maybe more accurate in short term)
  let doubleTime = 0.7/(iniconfirmed-input.Pre_confirmed)*14*input.Pre_confirmed;

  let gamma = 1/14; //gamma default value = 10, meaning average 10 days of infection before recover
  // get beta
  let beta = (2**(1/doubleTime)-1+gamma)/inisuspected;
  // create prediction arrays for SIR
  let presuspected = [inisuspected,];
  let preinfected = [iniinfected,];
  let preremoved = [iniremoved,];
  let prerecovered = [inirecovered,]
  let predeath = [inideath,]
  let preconfirmed = [iniconfirmed,]
  // put values in SIR arrays with model, length 30
  for (let i=0;i<30;i++){
      presuspected.push(presuspected[i]-beta*presuspected[i]*preinfected[i]);
      preinfected.push(preinfected[i]+beta*presuspected[i]*preinfected[i]-gamma*preinfected[i]);
      preremoved.push(preremoved[i]+gamma*preinfected[i]);
      predeath.push(preremoved[i+1]*deathRate);
      prerecovered.push(preremoved[i+1]*(1-deathRate));
      preconfirmed.push(preconfirmed[i]+beta*presuspected[i]*preinfected[i])
  }
  let result = {preconfirmed,predeath,prerecovered};
  return(result);
}

  let SIRData =(dailyData,population)=>{
    if(!dailyData[0]) return null;
    // get confirmed number (different from infected)
    let confirmed = dailyData.map((data) => data.confirmed);
    // get training data
    let total = population;
    let infected = dailyData.map((data) => data.confirmed - data.recovered - data.deaths);
    let removed = dailyData.map((data)=> data.deaths+data.recovered);
    //Get initial data for SIR
    let inisuspected = total - confirmed[0] - removed[0];
    let iniinfected = confirmed[0]-confirmed[14];
    let iniremoved = removed[0];
    // estimate the death rate by the data on last day
    let deathRate = dailyData[0].deaths / removed[0];
    // get doubling time by using last 5 days (maybe more accurate in short term)
    let doubleTime = 0.7/(confirmed[0]-confirmed[5])*5*confirmed[5];
    let gamma = 1/14; //gamma default value = 10, meaning average 10 days of infection before recover
    // get beta
    let beta = (2**(1/doubleTime)-1+gamma)/inisuspected;
    // create prediction arrays for SIR
    let presuspected = [inisuspected,];
    let preinfected = [iniinfected,];
    let preremoved = [iniremoved,];
    let prerecovered = [iniremoved*(1-deathRate),]
    let predeath = [iniremoved*deathRate,]
    let preconfirmed = [confirmed[0],]
    // put values in SIR arrays with model, length 30
    for (let i=0;i<30;i++){
        presuspected.push(presuspected[i]-beta*presuspected[i]*preinfected[i]);
        preinfected.push(preinfected[i]+beta*presuspected[i]*preinfected[i]-gamma*preinfected[i]);
        preremoved.push(preremoved[i]+gamma*preinfected[i]);
        predeath.push(preremoved[i+1]*deathRate);
        prerecovered.push(preremoved[i+1]*(1-deathRate));
        preconfirmed.push(preconfirmed[i]+beta*presuspected[i]*preinfected[i])
    }
    let result = {preconfirmed,predeath,prerecovered};
    console.log(doubleTime)
    return(result);
  }
  
  //setPrediction(SIRData(dailyData,300000000));

   //let prediction = (SIRData(dailyData,300000000));

   const getDatesBetweenDates = (startDate, endDate) => {
    let dates = []
    let res = []
    //to avoid modifying the original date
    const theDate = new Date(startDate)
    while (theDate < endDate) {
      dates = [...dates, new Date(theDate)]
      theDate.setDate(theDate.getDate() + 1)
      res.push(theDate.toLocaleDateString())
    }
    return res;
  }

// make form to customize SIR prediction
  const SIRForm = (
  <form onSubmit={handleSubmit}>
      <div>
        <br/>
          <label>Population</label>
        <br/>
          <input type="numer" name="Population" value={userInput.Population} onChange={handleChange}/>
        <br/>
          <label>Confirmed(14 days ago)</label>
        <br/>
          <input type="numer" name="Pre_confirmed" value={userInput.Pre_confirmed} onChange={handleChange}/>
        <br/>
          <label>Confirmed(now)</label>
        <br/>
          <input type="text" name="Confirmed" value={userInput.Confirmed} onChange={handleChange}/>
        <br/>
          <label>Recovered</label>
        <br/>
          <input type="numer" name="Recovered" value={userInput.Recovered} onChange={handleChange}/>
        <br/>
          <label>Deaths</label>
        <br/>
          <input type="numer" name="Death" value={userInput.Death} onChange={handleChange}/>
          <input type="submit" value="Submit" />
      </div>
  </form>)


// make SIR chart 
  const SIRChart = (
    dailyData[0]&&prediction ? 
    (
      <Line
        data={{
          labels: getDatesBetweenDates(new Date(),new Date().setDate(new Date().getDate()+30)),
          
          datasets: [{
            data: prediction.preconfirmed,
            label: 'Infected',
            borderColor: '#3333ff',
            fill: true,
          }, {
            data: prediction.predeath,
            label: 'Deaths',
            borderColor: 'red',
            backgroundColor: 'rgba(255, 0, 0, 0.5)',
            fill: true,
          },  {
            data: prediction.prerecovered,
            label: 'Recovered',
            borderColor: 'green',
            backgroundColor: 'rgba(0, 255, 0, 0.5)',
            fill: true,
          },
          ],
        }}
      />
    ) : null
  );

  let USprediction = SIRData(dailyData,300000000);
  const USSIRChart = (
    dailyData[0]&&USprediction ? 
    (
      <Line
        data={{
          labels: getDatesBetweenDates(new Date(),new Date().setDate(new Date().getDate()+30)),
          
          datasets: [{
            data: USprediction.preconfirmed,
            label: 'Infected',
            borderColor: '#3333ff',
            fill: true,
          }, {
            data: USprediction.predeath,
            label: 'Deaths',
            borderColor: 'red',
            backgroundColor: 'rgba(255, 0, 0, 0.5)',
            fill: true,
          },  {
            data: USprediction.prerecovered,
            label: 'Recovered',
            borderColor: 'green',
            backgroundColor: 'rgba(0, 255, 0, 0.5)',
            fill: true,
          },
          ],
        }}
      />
    ) : null
  );
  
    return(

        <div className={styles.container}>
            <h2>SIR prediction for US(30days)</h2>
            {USSIRChart}
            <h2>SIR prediction with Customized Inputs</h2>
            <div className={styles.inputs}>
              {SIRForm}
              {SIRChart}  
            </div>  
            
        </div>
        
    )
};

export default SIRchart;
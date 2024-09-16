import React, { useEffect } from 'react'
import './preloader.css'
import {preLoaderAnim} from '../animations'
import Marrakech from '../images/Marrakech.png'
const Preloader = () => {

    useEffect(() => {
        preLoaderAnim();
      }, []);

  return (
    
    <div className="preloader">
      
        <div className="texts-container">
            <span>Exploring,</span>
            <span>Discovering,</span>
            <span>Navigating!</span>
        </div>
        <img className="Marrakech" src={Marrakech}/>
       
    </div>
  )
}

export default Preloader
import {useState} from 'react'
import axios from 'axios'


const api=axios.create({
    baseURL:'http://127.0.0.1:8000/'
})
function QuestionForm(){
    const [question, setQuestion]=useState('');
    const [answer, setAnswer]=useState('');
     
    const handleSubmit=async (e)=>{
        e.preventDefault();
        console.log("your question :",question);
        const response= await api.post('/chat',{message:question});
        setAnswer(response.data.answer);
        console.log(answer);
    }
    return (
        <div>
            <form>
            <input type="text" value={question} onChange={(e)=>setQuestion(e.target.value)}/>
            <button type="submit" onClick={handleSubmit}>Submit</button>
            </form>
            <div>
                <h2>Answer:</h2>
                <p>{answer}</p>
            </div>
        </div>
    );
}

export default QuestionForm;
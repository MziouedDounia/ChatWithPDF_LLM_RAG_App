from query_data import query_rag
from langchain_ollama.llms import OllamaLLM

EVAL_PROMPT = """
Expected Response: {expected_response}
Actual Response: {actual_response}
---
(Answer with 'true' or 'false') Does the actual response match the expected response?
"""

model = OllamaLLM(model="qwen2:1.5b")  # Create the model instance once

def query_and_validate(question: str, expected_response: str):
    try:
        response_text = query_rag(question)
    except Exception as e:
        print(f"Error querying RAG model: {e}")
        return False

    prompt = EVAL_PROMPT.format(
        expected_response=expected_response, actual_response=response_text
    )

    try:
        evaluation_results_str = model.invoke(prompt)
    except Exception as e:
        print(f"Error invoking OllamaLLM model: {e}")
        return False

    evaluation_results_str_cleaned = evaluation_results_str.strip().lower()

    print("Evaluation Prompt:")
    print(prompt)
    print("Model Response:")
    print(evaluation_results_str_cleaned)

    if "true" in evaluation_results_str_cleaned:
        # Print response in Green if it is correct.
        print("\033[92m" + f"Response: {evaluation_results_str_cleaned}" + "\033[0m")
        return True
    elif "false" in evaluation_results_str_cleaned:
        # Print response in Red if it is incorrect.
        print("\033[91m" + f"Response: {evaluation_results_str_cleaned}" + "\033[0m")
        return False
    else:
        raise ValueError(
            f"Invalid evaluation result. Cannot determine if 'true' or 'false'."
        )

def test_el_badi_palace_creation():
    assert query_and_validate(
        question="How many years did it take to build El Badi Palace? (Answer with the number only)",
        expected_response="16"
    )

def test_el_badi_palace_decline():
    assert query_and_validate(
        question="For how many years did El Badi Palace deteriorate following the death of the 6th Moroccan Sultan? (Answer with the number only)",
        expected_response="25"
    )

def test_el_badi_palace_structure():
    assert query_and_validate(
        question="What is the main feature of the main square at El Badi Palace? (Provide a brief description)",
        expected_response="large pool"
    )

def test_ahmed_al_mansur_birth_year():
    assert query_and_validate(
        question="In which year was Ahmed al-Mansur born? (Answer with the number only)",
        expected_response="1549"
    )

def test_ahmed_al_mansur_father():
    assert query_and_validate(
        question="What was the name of Ahmed al-Mansur's father? (Provide the full name)",
        expected_response="Mohammed ash-Sheikh"
    )

def test_ahmed_al_mansur_battle_year():
    assert query_and_validate(
        question="In which year did the Battle of the Three Kings take place? (Answer with the number only)",
        expected_response="1578"
    )

def test_ahmed_al_mansur_defeated_force():
    assert query_and_validate(
        question="Which forces were defeated in the Battle of the Three Kings? (Provide the name of the country)",
        expected_response="Portuguese"
    )

def test_ahmed_al_mansur_achievements():
    assert query_and_validate(
        question="In which fields did Ahmed al-Mansur bring significant advancements during his reign? (Provide a comma-separated list)",
        expected_response="architecture, arts, foreign policy"
    )

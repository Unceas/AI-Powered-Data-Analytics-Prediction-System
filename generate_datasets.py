import os
import csv
import random
from datetime import datetime, timedelta

def main():
    random.seed(42)
    output_dir = os.path.join("frontend-react", "public", "datasets")
    os.makedirs(output_dir, exist_ok=True)
    
    # 1. Customer Churn Prediction
    churn_path = os.path.join(output_dir, "customer_churn.csv")
    with open(churn_path, "w", newline="") as f:
        writer = csv.writer(f)
        writer.writerow([
            "customer_id", "age", "tenure", "monthly_charges", "contract_type",
            "support_calls", "satisfaction_score", "payment_method", "internet_service", "churn"
        ])
        for i in range(1, 251):
            cust_id = f"C{10000 + i}"
            age = random.randint(18, 80)
            tenure = random.randint(1, 72)
            monthly_charges = round(random.uniform(20.0, 120.0), 2)
            contract = random.choice(["Month-to-month", "One year", "Two year"])
            support_calls = random.randint(0, 9)
            satisfaction = random.randint(1, 5)
            payment = random.choice(["Electronic check", "Mailed check", "Bank transfer", "Credit card"])
            internet = random.choice(["DSL", "Fiber optic", "No"])
            
            # Formulate Churn probability
            score = (monthly_charges / 120.0) * 1.5 + (support_calls * 0.45) + (6 - satisfaction) * 0.5
            if contract == "Month-to-month":
                score += 0.8
            elif contract == "Two year":
                score -= 0.6
                
            churn = 1 if score > 2.2 else 0
            writer.writerow([
                cust_id, age, tenure, monthly_charges, contract,
                support_calls, satisfaction, payment, internet, churn
            ])
            
    # 2. Employee Attrition Analysis
    attr_path = os.path.join(output_dir, "employee_attrition.csv")
    with open(attr_path, "w", newline="") as f:
        writer = csv.writer(f)
        writer.writerow([
            "employee_id", "department", "salary", "years_at_company", "overtime",
            "job_satisfaction", "work_life_balance", "training_hours", "attrition"
        ])
        for i in range(1, 251):
            emp_id = f"E{20000 + i}"
            dept = random.choice(["Sales", "R&D", "HR", "Engineering"])
            salary = random.randint(3000, 15000)
            years = random.randint(1, 15)
            overtime = random.choice(["Yes", "No"])
            satisfaction = random.randint(1, 5)
            wlb = random.randint(1, 4)
            training = random.randint(10, 80)
            
            # Formulate Attrition probability
            score = (6 - satisfaction) * 0.6 + (5 - wlb) * 0.4 + (15000 - salary) / 10000.0
            if overtime == "Yes":
                score += 1.0
            if years < 2:
                score += 0.5
                
            attrition = 1 if score > 2.3 else 0
            writer.writerow([
                emp_id, dept, salary, years, overtime,
                satisfaction, wlb, training, attrition
            ])
            
    # 3. Healthcare Risk Assessment
    risk_path = os.path.join(output_dir, "healthcare_risk.csv")
    with open(risk_path, "w", newline="") as f:
        writer = csv.writer(f)
        writer.writerow([
            "age", "bmi", "blood_pressure", "cholesterol", "glucose", "smoking", "exercise_frequency", "risk"
        ])
        for i in range(1, 251):
            age = random.randint(20, 85)
            bmi = round(random.uniform(18.5, 40.0), 1)
            bp = random.randint(90, 180)
            chol = random.randint(150, 320)
            gluc = random.randint(70, 220)
            smoking = random.choice([0, 1])
            exercise = random.randint(0, 7)
            
            # Formulate Risk probability
            score = (bmi / 40.0) * 1.5 + (gluc / 220.0) * 1.5 + (bp / 180.0) * 1.0 + smoking * 0.8 - (exercise * 0.15)
            if age > 60:
                score += 0.5
                
            risk = 1 if score > 1.8 else 0
            writer.writerow([
                age, bmi, bp, chol, gluc, smoking, exercise, risk
            ])
            
    # 4. Student Performance Analytics
    stud_path = os.path.join(output_dir, "student_performance.csv")
    with open(stud_path, "w", newline="") as f:
        writer = csv.writer(f)
        writer.writerow([
            "attendance", "study_hours", "assignments_completed", "midterm_score", "project_score", "final_score", "pass_fail"
        ])
        for i in range(1, 251):
            attendance = round(random.uniform(50.0, 100.0), 1)
            study = round(random.uniform(2.0, 30.0), 1)
            assignments = random.randint(0, 10)
            midterm = round(random.uniform(30.0, 100.0), 1)
            project = round(random.uniform(40.0, 100.0), 1)
            
            # Calculate final score with statistical correlation
            final = (attendance * 0.25) + (study * 0.8) + (assignments * 2.0) + (midterm * 0.2) + (project * 0.2) + random.uniform(-4.0, 4.0)
            final = max(0.0, min(100.0, round(final, 1)))
            pass_fail = 1 if final >= 55.0 else 0
            
            writer.writerow([
                attendance, study, assignments, midterm, project, final, pass_fail
            ])
            
    # 5. Retail Sales Forecasting
    sales_path = os.path.join(output_dir, "retail_sales.csv")
    with open(sales_path, "w", newline="") as f:
        writer = csv.writer(f)
        writer.writerow([
            "store_id", "date", "promotion", "footfall", "inventory", "marketing_spend", "sales"
        ])
        base_date = datetime(2026, 1, 1)
        for i in range(1, 251):
            store_id = random.randint(1, 5)
            date_str = (base_date + timedelta(days=i)).strftime("%Y-%m-%d")
            promo = random.choice([0, 1])
            footfall = 300 + (store_id * 60) + (promo * 450) + random.randint(-40, 40)
            inventory = random.randint(1000, 5000)
            mkt_spend = round(random.uniform(100.0, 1500.0), 2)
            
            # Linear model for sales output (Regression target)
            sales = (footfall * 8.2) + (mkt_spend * 2.8) + (promo * 1200.0) + random.uniform(-150.0, 150.0)
            sales = round(max(500.0, sales), 2)
            
            writer.writerow([
                store_id, date_str, promo, footfall, inventory, mkt_spend, sales
            ])
            
    # 6. Sports Performance Analysis
    sports_path = os.path.join(output_dir, "sports_performance.csv")
    with open(sports_path, "w", newline="") as f:
        writer = csv.writer(f)
        writer.writerow([
            "player_id", "training_hours", "heart_rate_max", "sleep_quality", "fatigue_score", "vo2_max", "injury_risk"
        ])
        for i in range(1, 251):
            player_id = f"P{30000 + i}"
            training_hours = round(random.uniform(5.0, 30.0), 1)
            heart_rate_max = random.randint(150, 210)
            sleep_quality = random.randint(1, 10)
            fatigue_score = random.randint(1, 10)
            vo2_max = round(random.uniform(35.0, 75.0), 1)
            
            # Formulate Injury Risk probability (0 or 1)
            score = (fatigue_score / 10.0) * 1.5 + (11 - sleep_quality) * 0.4 + (training_hours / 30.0) * 1.0 + (heart_rate_max / 210.0) * 0.5 - (vo2_max / 75.0) * 0.8
            injury_risk = 1 if score > 1.7 else 0
            writer.writerow([
                player_id, training_hours, heart_rate_max, sleep_quality, fatigue_score, vo2_max, injury_risk
            ])
            
    print("All 6 sample datasets successfully generated inside public/datasets/.")

if __name__ == "__main__":
    main()

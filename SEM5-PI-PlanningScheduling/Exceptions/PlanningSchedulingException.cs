namespace SEM5_PI_DecisionEngineAPI.Exceptions
{
    public class PlanningSchedulingException : Exception
    {
        public PlanningSchedulingException(string message)
            : base(message)
        {
        }

        public PlanningSchedulingException(string message, Exception innerException)
            : base(message, innerException)
        {
        }
    }
}
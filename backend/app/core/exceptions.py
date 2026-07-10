class AppException(Exception):
    def __init__(self, message: str, status_code: int = 500):
        self.message = message
        self.status_code = status_code
        super().__init__(message)


class ConfigurationException(AppException):
    def __init__(self, message: str = "Invalid configuration"):
        super().__init__(message, status_code=500)


class ValidationException(AppException):
    def __init__(self, message: str = "Validation failed"):
        super().__init__(message, status_code=422)


class DocumentException(AppException):
    def __init__(self, message: str = "Document processing failed"):
        super().__init__(message, status_code=422)


class PolicyException(AppException):
    def __init__(self, message: str = "Policy validation failed"):
        super().__init__(message, status_code=422)


class FraudException(AppException):
    def __init__(self, message: str = "Fraud check failed"):
        super().__init__(message, status_code=422)


class AgentException(AppException):
    def __init__(self, message: str = "Agent execution failed"):
        super().__init__(message, status_code=500)

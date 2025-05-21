import numpy as np
import scipy.stats as si

def binomial_option_price(S, K, T, r, sigma, n, option_type="call"):
    """
    Computes the option price using a binomial tree model.

    Parameters:
    S (float): Current stock price
    K (float): Strike price
    T (float): Time to expiration (in years)
    r (float): Risk-free rate (as a decimal)
    sigma (float): Volatility (as a decimal)
    n (int): Number of time steps in the binomial model
    option_type (str): "call" or "put"

    Returns:
    float: The estimated option price
    """

    dt = T / n  # Time step size
    u = np.exp(sigma * np.sqrt(dt))  # Up factor
    d = 1 / u  # Down factor
    p = (np.exp(r * dt) - d) / (u - d)  # Risk-neutral probability

    # Price tree initialization
    stock_tree = np.zeros((n + 1, n + 1))

    # Compute stock prices at each node
    for i in range(n + 1):
        for j in range(i + 1):
            stock_tree[j, i] = S * (u ** (i - j)) * (d ** j)

    # Compute option values at expiration
    option_tree = np.zeros((n + 1, n + 1))
    if option_type == "call":
        option_tree[:, n] = np.maximum(stock_tree[:, n] - K, 0)
    elif option_type == "put":
        option_tree[:, n] = np.maximum(K - stock_tree[:, n], 0)

    # Backward induction to determine option price today
    for i in range(n - 1, -1, -1):
        for j in range(i + 1):
            option_tree[j, i] = np.exp(-r * dt) * (p * option_tree[j, i + 1] + (1 - p) * option_tree[j + 1, i + 1])

    return option_tree[0, 0]  # Option price at initial node

# Example Parameters
S = 100   # Current stock price
K = 105   # Strike price
T = 0.5   # Time to expiration in years (6 months)
r = 0.05  # Risk-free rate (5%)
sigma = 0.3  # Volatility (30%)
n = 100  # Number of time steps

# Calculate option prices
call_price = binomial_option_price(S, K, T, r, sigma, n, option_type="call")
put_price = binomial_option_price(S, K, T, r, sigma, n, option_type="put")

call_price, put_price

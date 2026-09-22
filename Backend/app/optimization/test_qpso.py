from app.optimization.qpso_solver import QPSOSolver
from app.optimization.fitness import test_fitness


solver = QPSOSolver(
    fitness_function=test_fitness,
    dimensions=5,
    num_particles=20,
    max_iterations=50,
    beta=0.5,
    seed=42
)


result = solver.solve()


print("Best solution:")
print(result["best_solution"])

print("\nBest fitness:")
print(result["best_fitness"])
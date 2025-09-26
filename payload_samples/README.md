# Payload Samples

The file `mock_scenarios_v1.json` mirrors the provided regression payload samples. Use it to replay estimator scenarios when seeding test data.

## Contract-linked examples
- `quotes_post_success_201.json`: Happy path request/response pair with UTC timestamps.
- `quotes_post_conflict_409.json`: dedupKey conflict envelope (`DUPLICATE_KEY`).
- `quotes_post_unprocessable_422.json`: validation error surface with structured details.
- `error_500.json`: generic internal error example with traceId placeholder.

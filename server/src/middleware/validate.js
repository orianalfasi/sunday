import AppError from "../lib/AppError.js";

export default function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const message = result.error.issues[0]?.message ?? "Invalid request";
      throw new AppError(400, message);
    }
    req.body = result.data;
    next();
  };
}

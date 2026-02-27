
-- Add trigger to recalculate points when daily prayers change
CREATE OR REPLACE TRIGGER recalc_points_on_daily_prayer
  AFTER INSERT OR UPDATE OR DELETE ON public.user_daily_prayers
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_recalculate_points();

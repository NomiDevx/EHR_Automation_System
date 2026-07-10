

DO $$
DECLARE
  max_num   bigint;
  next_val  bigint;
BEGIN
  -- Extract the numeric portion from MRNs that match 'MRN-NNNNNN'
  SELECT COALESCE(
    MAX(
      CAST(
        REGEXP_REPLACE(mrn, '^MRN-0*', '')
        AS bigint
      )
    ),
    100000
  )
  INTO max_num
  FROM patients
  WHERE mrn ~ '^MRN-[0-9]+$';

  -- Advance the sequence to be 1 above the highest existing value
  next_val := max_num + 1;

  PERFORM setval('mrn_seq', next_val, false);   -- false = next call returns next_val

  RAISE NOTICE 'mrn_seq reset: next MRN will be MRN-%', lpad(next_val::text, 6, '0');
END;
$$;

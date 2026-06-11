-- Storage UPDATE/DELETE 정책 추가
-- uploadPersonImage에서 upsert:true 사용 시 동일 경로 덮어쓰기 허용
-- (첫 세그먼트 = 'demo-user-1' → 익명 사용자 OK)

DO $$ BEGIN
  CREATE POLICY "storage: owner update"
    ON storage.objects FOR UPDATE
    USING (
      bucket_id = 'clothing-images'
      AND (auth.uid()::text = split_part(name, '/', 1) OR split_part(name, '/', 1) = 'demo-user-1')
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "storage: owner delete"
    ON storage.objects FOR DELETE
    USING (
      bucket_id = 'clothing-images'
      AND (auth.uid()::text = split_part(name, '/', 1) OR split_part(name, '/', 1) = 'demo-user-1')
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

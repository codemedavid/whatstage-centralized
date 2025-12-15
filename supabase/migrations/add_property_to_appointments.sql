-- Add property_id to appointments table
ALTER TABLE appointments 
ADD COLUMN IF NOT EXISTS property_id UUID REFERENCES properties(id);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_appointments_property_id ON appointments(property_id);

-- Update the view to include property info
DROP VIEW IF EXISTS upcoming_appointments;

CREATE OR REPLACE VIEW upcoming_appointments AS
SELECT 
  a.*,
  l.name as lead_name,
  l.profile_pic as lead_profile_pic,
  l.phone as lead_phone,
  l.email as lead_email,
  p.title as property_title,
  p.address as property_address,
  p.image_url as property_image_url
FROM appointments a
LEFT JOIN leads l ON a.sender_psid = l.sender_id
LEFT JOIN properties p ON a.property_id = p.id
WHERE a.appointment_date >= CURRENT_DATE
  AND a.status IN ('pending', 'confirmed')
ORDER BY a.appointment_date, a.start_time;

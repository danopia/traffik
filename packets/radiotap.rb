require './packets/ieee'

class Radiotap
  def self.run packet
    length = packet[2,2].unpack('v')[0]
    IEEE.run packet[length..-1]
  end
end

